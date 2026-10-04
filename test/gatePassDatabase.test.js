// Explicit integration check: creates and removes an isolated schema in the configured DB.
const assert = require('node:assert/strict');
const Module = require('node:module');
const pg = require('pg');
const { dbConfig } = require('../src/config/dbConfig');
const schema = `gate_pass_test_${process.pid}_${Date.now()}`;
const knex = require('knex')({ client: 'pg', connection: { ...dbConfig, options: `-c search_path=${schema}` } });
const pools = [];
const routes = {};
const router = { use() {} };
for (const method of ['get','post','patch']) router[method] = (path, handler) => { routes[`${method} ${path}`] = handler; };
const originalLoad = Module._load;
Module._load = function(name, ...args) {
  if (name === 'pg') return { ...pg, Pool: class extends pg.Pool { constructor(config) { super({ ...config, options: `-c search_path=${schema}` }); pools.push(this); } } };
  if (name === 'express') return { Router: () => router };
  if (name === '../middlewares/auth') return { authenticateToken() {} };
  if (['./deliveryorderService','./driverService','./customerService','./supplierService','../controllers/pdfController','./syncService'].includes(name)) return {};
  return originalLoad.call(this, name, ...args);
};
const manual = require('../src/services/manualModeService');
const cameras = require('../src/services/activitiesService');
const controller = require('../src/controllers/manualModeController');
require('../src/routes/gatePassRoutes');
Module._load = originalLoad;
const firstMigration = require('../migrations/20261003000100_create_gate_passes');
const migration = require('../migrations/20261004000100_gate_camera_roles_and_manual_scope');
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
async function call(route, body, key = '', id) {
  const res = response();
  await routes[route]({ body, params: { id: String(id) }, actor: { id: 1, name: 'Operator', can_review: true }, get: () => key },res);
  return res;
}
(async () => {
  try {
    await knex.raw(`CREATE SCHEMA ${schema}`);
    await knex.schema.createTable('tos_users', t => { t.increments('id'); t.string('first_name'); t.string('last_name'); t.string('phone'); });
    await knex.schema.createTable('tos_manual_mode', t => {
      t.increments('id'); t.integer('user_id'); t.string('status').defaultTo('pending'); t.text('reason'); t.timestamp('expires_at'); t.timestamps(true,true);
    });
    await require('../migrations/20250227095312_create_camera_information').up(knex);
    await require('../migrations/20250227095313_add_camera_credentials').up(knex);
    await knex.schema.createTable('tos_activity_points', t => { t.increments('id'); t.string('name'); t.string('address'); t.boolean('isactive'); t.specificType('camera_ids','integer[]'); });
    await knex.schema.createTable('tos_anpr_table', t => { t.increments('id'); t.string('truck_no'); t.integer('camera_id'); t.timestamp('snap_time'); t.string('mode'); });
    await firstMigration.up(knex);
    await knex.schema.createTable('tos_drivers', t => { t.increments('id'); t.string('name'); t.string('id_no'); t.boolean('is_active'); });
    await knex.schema.createTable('tos_transporter', t => { t.increments('id'); t.string('title'); t.boolean('isactive'); });
    await knex.schema.createTable('tos_buying_center', t => { t.increments('id'); t.string('name'); t.string('village_name'); t.boolean('is_active'); });
    await require('../migrations/20261004000200_gate_pass_master_details').up(knex);
    await knex('tos_drivers').insert([{id:1,name:'Selected Driver',id_no:'ID123',is_active:true},{id:2,name:'Inactive',is_active:false}]);
    await knex('tos_transporter').insert({id:1,title:'Selected Transporter',isactive:true});
    await knex('tos_buying_center').insert({id:1,name:'Center',village_name:'Village',is_active:true});
    await knex('tos_users').insert({ id: 1, first_name: 'Operator' });
    await knex('tos_manual_mode').insert({ user_id: 1, status: 'ended' });
    await knex('tos_camera_information').insert({ model: 'Existing WB', ip_address: '192.0.2.1' });
    await migration.up(knex);
    assert.equal((await knex('tos_camera_information').first()).role, 'weighbridge');
    assert.equal((await knex('tos_manual_mode').first()).scope, 'weighbridge');

    const [wb, gate] = await Promise.all([
      manual.requestManualMode(1,'WB unavailable'), manual.requestManualMode(1,'Gate camera unavailable','gate_pass')
    ]);
    assert.ok(wb.status && gate.status);
    assert.equal((await manual.requestManualMode(1,'Again','gate_pass')).status,false);
    const future = new Date(Date.now()+3600000);
    assert.equal((await manual.approveManualMode(gate.data.id,future,'weighbridge',2)).status,false);
    const unauthorized = response();
    await controller.approveManualMode({ body: { id: gate.data.id, scope: 'gate_pass', expires_at: future }, query: {}, user: { id: 1 }, operator: { admin: false, supervisor: false } },unauthorized);
    assert.equal(unauthorized.code,403);
    assert.ok((await manual.approveManualMode(gate.data.id,future,'gate_pass',2)).status);
    assert.equal((await manual.isUserInManualMode(1)).status,false);
    assert.equal((await manual.postManualModeLog('T123ABC',1,1)).status,false);
    const created = await call('post /manual',{ plate:'T123ABC', status:'approved' });
    assert.equal(created.code,201);
    assert.equal(created.body.data.status,'pending');
    assert.equal(created.body.data.source,'manual');
    assert.equal(created.body.data.manual_mode_id,gate.data.id);
    assert.equal((await knex('tos_gate_pass_audit').first()).action,'manual_created');
    const passId = created.body.data.id;
    const edit = { plate:'T123ABC',driver_id:1,transporter_id:1,buying_center_id:1,notes:'Delivery visit',version:0 };
    assert.equal((await call('patch /:id',{...edit,driver_id:2},'',passId)).code,400);
    const savedDetails = await call('patch /:id',edit,'',passId);
    assert.equal(savedDetails.code,200);
    assert.equal(savedDetails.body.data.driver_name,'Selected Driver');
    assert.equal(savedDetails.body.data.buying_center_name,'Center - Village');
    assert.equal(savedDetails.body.data.notes,'Delivery visit');
    const cleared = await call('patch /:id',{...edit,transporter_id:null,buying_center_id:null,version:1},'',passId);
    assert.equal(cleared.body.data.transporter_name,'');
    assert.equal(cleared.body.data.buying_center_name,'');
    assert.equal((await call('post /:id/review',{status:'approved',version:2},'',passId)).code,200);
    await knex('tos_drivers').where({id:1}).update({name:'Renamed Driver'});
    assert.equal((await knex('tos_gate_passes').where({id:passId}).first()).driver_name,'Selected Driver');
    assert.equal((await call('patch /:id',{...edit,version:3},'',passId)).code,409);
    await manual.endManualModeSession(gate.data.id,'gate_pass');
    assert.ok((await manual.approveManualMode(wb.data.id,future,'weighbridge',2)).status);
    assert.equal((await call('post /manual',{plate:'T999ABC'})).code,403);
    const expired = await manual.requestManualMode(1,'Still unavailable','gate_pass');
    await manual.approveManualMode(expired.data.id,future,'gate_pass',2);
    await knex('tos_manual_mode').where({id:expired.data.id}).update({expires_at:new Date(Date.now()-1000)});
    assert.equal((await call('post /manual',{plate:'T999ABC'})).code,403);
    const repeated = await Promise.all([manual.requestManualMode(1,'Retry A','gate_pass'),manual.requestManualMode(1,'Retry B','gate_pass')]);
    assert.equal(repeated.filter(x=>x.status).length,1);
    await assert.rejects(()=>manual.requestManualMode(1,'Bad scope','all'));

    const config = { model:'Gate',ip_address:'192.0.2.2',rtsp_url:'rtsp://192.0.2.2/stream', status:'active',role:'gate_pass',device_id:'GATE_1',capture_key:'database-only-secret',username:'admin',password:'password',configuration:{} };
    const saved = await cameras.createOrUpdateCamera(config);
    const event = {camera_id:'GATE_1',reg_no:'T999ABC',snap_time:'2026-10-04T12:00:00+03:00'};
    assert.equal((await call('post /capture',event,config.capture_key)).code,201);
    assert.equal((await call('post /capture',event,config.capture_key)).body.duplicate,true);
    await cameras.createOrUpdateCamera({...config,id:saved.id,status:'inactive',capture_key:'',password:''});
    assert.equal((await call('post /capture',event,config.capture_key)).code,403);
    await cameras.createOrUpdateCamera({...config,id:saved.id,role:'weighbridge'});
    assert.equal((await call('post /capture',event,config.capture_key)).code,403);
    await cameras.createOrUpdateActivityPoint('WB','address',true,[saved.id]);
    await assert.rejects(()=>cameras.createOrUpdateCamera({...config,id:saved.id}), /Unlink/);
    await cameras.createOrUpdateActivityPoint('WB','address',true,[]);
    await cameras.createOrUpdateCamera({...config,id:saved.id});
    await assert.rejects(()=>cameras.createOrUpdateActivityPoint('WB','address',true,[saved.id]), /weighbridge cameras/);
    await cameras.createOrUpdateCamera({...config,id:saved.id,ip_address:'192.0.2.3',capture_key:'rotated-camera-secret'});
    assert.equal((await call('post /capture',event,config.capture_key)).code,403);
    assert.equal((await call('post /capture',event,'rotated-camera-secret')).code,200);
    const listed = await cameras.getAllCameras();
    assert.ok(listed.find(x=>x.id===saved.id).has_capture_key);
    assert.equal(listed.find(x=>x.id===saved.id).capture_key,undefined);
    assert.equal((await knex('tos_camera_information').where({id:saved.id}).first()).ip_address,'192.0.2.3');
    await assert.rejects(()=>migration.down(knex), /manual gate passes/);
    await knex('tos_gate_pass_audit').del();
    await knex('tos_gate_passes').del();
    await assert.rejects(()=>migration.down(knex), /manual requests/);
    await knex('tos_manual_mode').where({scope:'gate_pass'}).del();
    await require('../migrations/20261004000200_gate_pass_master_details').down(knex);
    await migration.down(knex);
    console.log('PASS: migrations, independent manual scopes, authorization, expiry, concurrent requests, manual audit, dynamic cameras, key rotation and WB assignment isolation.');
  } finally {
    await Promise.all(pools.map(pool=>pool.end()));
    await knex.raw(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await knex.destroy();
  }
})().catch(error => { console.error(error); process.exitCode=1; });
