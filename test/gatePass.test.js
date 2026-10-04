const assert = require('node:assert/strict');
const { test } = require('node:test');
const Module = require('module');
const { details, review } = require('../src/utils/gatePassValidation');
const routes = {};
const middleware = [];
const queries = [];
let record;
let actor;
let printed = 0;
let audit;
let gateCamera = null;
let manualSession = null;
const client = {
  release() {},
  async query(sql, values) {
    queries.push(sql);
    if (sql.includes('FROM tos_drivers')) return { rows: values[0] === 1 ? [{id:1,name:'Driver',id_no:''}] : [] };
    if (sql.includes('FROM tos_transporter')) return { rows: values[0] === 2 ? [{id:2,title:'Transport'}] : [] };
    if (sql.includes('FROM tos_buying_center')) return { rows: values[0] === 3 ? [{id:3,name:'Center'}] : [] };
    if (sql.includes('FROM tos_manual_mode')) return { rows: manualSession ? [manualSession] : [] };
    if (sql.startsWith('INSERT INTO tos_gate_passes') && sql.includes("'manual'")) return { rows: [{ id: 2, status: 'pending', source: 'manual', original_plate: '', plate: values[0], created_by: values[1], manual_mode_id: values[2] }] };
    if (sql.startsWith('SELECT * FROM tos_gate_passes')) return { rows: record ? [record] : [] };
    if (sql.startsWith('UPDATE tos_gate_passes')) return { rows: [{ ...record }] };
    if (sql.startsWith('INSERT INTO tos_gate_pass_audit')) audit = values;
    return { rows: [] };
  },
};
const pool = {
  connect: async () => client,
  query: async (sql, values) => {
    if (sql.includes('FROM tos_camera_information')) return { rows: gateCamera && values[0] === gateCamera.device_id ? [gateCamera] : [] };
    if (sql.includes('FROM tos_users')) return { rows: actor ? [actor] : [] };
    return client.query(sql, values);
  },
};
const router = { use: fn => middleware.push(fn) };
for (const method of ['get', 'post', 'patch']) router[method] = (path, handler) => { routes[`${method} ${path}`] = handler; };
const originalLoad = Module._load;
Module._load = function(name, ...args) {
  if (name === 'express') return { Router: () => router };
  if (name === 'pg') return { Pool: function() { return pool; } };
  if (name === '../middlewares/auth') return { authenticateToken: (_req, _res, next) => next() };
  if (name === '../services/gatePassPrinter') return { printGatePass: async () => { printed++; } };
  return originalLoad.call(this, name, ...args);
};
require('../src/routes/gatePassRoutes');
Module._load = originalLoad;
const full = { driver_id: 1, transporter_id: null, buying_center_id: null, buying_center_name: '', notes: '', plate: 'T123ABC', driver_name: 'Driver', driver_phone: '', driver_id_no: '', transporter_name: 'Transport', transporter_phone: '' };
async function request(route, body = {}, canReview = false) {
  const req = { params: { id: '1' }, body, actor: { id: 9, name: 'Test User', can_review: canReview } };
  const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; } };
  await routes[route](req, res);
  return res;
}
function reset() { queries.length = 0; audit = null; printed = 0; record = { id: 1, status: 'pending', version: 0, ...full }; }
test('approval requires plate and selected driver, with optional transporter', () => {
  for (const field of ['plate', 'driver_name', 'driver_id']) assert.throws(() => review({ ...full, status: 'pending', [field]: '' }, 'approved'));
  assert.doesNotThrow(() => review({ ...full, status: 'pending', transporter_name: '' }, 'approved'));
  for (const status of ['approved', 'rejected']) assert.throws(() => review({ ...full, status }, 'approved'));
  assert.throws(() => review({ status: 'pending' }, 'rejected', ' '));
  assert.throws(() => details({ ...full, plate: 'ABC\nCUT' }));
});
test('operators cannot approve or reject', async () => {
  reset();
  for (const status of ['approved', 'rejected']) assert.equal((await request('post /:id/review', { status, version: 0 })).code, 403);
  assert.equal(queries.length, 0);
});
test('stale updates roll back without edits or audit', async () => {
  reset();
  assert.equal((await request('patch /:id', { ...full, version: 5 })).code, 409);
  assert.ok(queries.includes('ROLLBACK'));
  assert.equal(audit, null);
});
test('approved and rejected records cannot be edited', async () => {
  for (const status of ['approved', 'rejected']) {
    reset(); record.status = status;
    assert.equal((await request('patch /:id', { ...full, version: 0 })).code, 409);
    assert.equal(audit, null);
  }
});
test('plate changes audit the old plate, new plate and actor in the transaction', async () => {
  reset();
  assert.equal((await request('patch /:id', { ...full, plate: 'T999XYZ', version: 0 })).code, 200);
  assert.equal(audit[1], 9);
  assert.deepEqual(JSON.parse(audit[4]).plate, { old: 'T123ABC', new: 'T999XYZ' });
  assert.equal(queries.at(-1), 'COMMIT');
  assert.ok(queries.some(sql => sql.includes('FOR UPDATE')));
});
test('approval and rejection are audited; approval validates saved details', async () => {
  reset(); record.driver_name = '';
  assert.equal((await request('post /:id/review', { status: 'approved', version: 0 }, true)).code, 400);
  assert.equal(audit, null);
  for (const status of ['approved', 'rejected']) {
    reset();
    assert.equal((await request('post /:id/review', { status, reason: 'Incorrect vehicle', version: 0 }, true)).code, 200);
    assert.equal(audit[3], status);
  }
});
test('printing is restricted to approved records', async () => {
  for (const status of ['pending', 'rejected', 'approved']) {
    reset(); record.status = status;
    const result = await request('post /:id/print', { version: 0 });
    assert.equal(result.code, status === 'approved' ? 200 : 409);
    assert.equal(printed, status === 'approved' ? 1 : 0);
  }
});
test('review permission is derived from active database role', async () => {
  for (const [role, expected] of [['Supervisor', true], ['Operator', false]]) {
    actor = { id: 9, user_type_id: 2, role, first_name: 'Test', last_name: 'User' };
    const req = { user: { id: 9 } };
    await middleware[1](req, {}, () => {});
    assert.equal(req.actor.can_review, expected);
  }
});
test('capture uses database camera configuration, role and active status', async () => {
  async function capture(key, body) {
    const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; } };
    await routes['post /capture']({ body, get: () => key }, res);
    return res;
  }
  gateCamera = { id: 1, device_id: 'GATE_1', capture_key: 'database-camera-secret' };
  const body = { camera_id: 'GATE_1', snap_time: '2026-10-03T10:00:00+03:00', reg_no: '' };
  assert.equal((await capture('wrong', body)).code, 403);
  assert.equal((await capture(gateCamera.capture_key, { ...body, camera_id: 'WB_1' })).code, 403);
  assert.equal((await capture(gateCamera.capture_key, { ...body, snap_time: 'invalid' })).code, 400);
  assert.equal((await capture(gateCamera.capture_key, body)).code, 200);
  gateCamera = null;
  assert.equal((await capture('database-camera-secret', body)).code, 403);
});
test('manual creation requires gate manual approval and audits provenance', async () => {
  reset(); manualSession = null;
  assert.equal((await request('post /manual', { plate: 'T123ABC' })).code, 403);
  assert.ok(queries.some(sql => sql.includes("scope='gate_pass'") && sql.includes('expires_at>clock_timestamp()')));
  assert.equal(audit, null);
  manualSession = { id: 17 };
  const response = await request('post /manual', { plate: ' t999xyz ' });
  assert.equal(response.code, 201);
  assert.equal(response.data.data.status, 'pending');
  assert.equal(response.data.data.plate, 'T999XYZ');
  assert.equal(response.data.data.original_plate, '');
  assert.equal(response.data.data.manual_mode_id, 17);
  assert.equal(audit[3], 'manual_created');
  assert.equal((await request('post /manual', { plate: ' ' })).code, 400);
});
test('both manual-mode approval queues require admin access', async () => {
  const service = require('../src/services/manualModeService');
  const controller = require('../src/controllers/manualModeController');
  const original = service.approveManualMode;
  const calls = [];
  service.approveManualMode = async (...args) => { calls.push(args); return { status: true }; };
  try {
    for (const scope of ['weighbridge', 'gate_pass']) {
      for (const admin of [false, true]) {
        const req = { body: { scope, id: 7, expires_at: '2030-01-01' }, query: {}, user: { id: 1 }, operator: { admin, supervisor: true } };
        const res = { code: 200, status(code) { this.code = code; return this; }, json() {} };
        await controller.approveManualMode(req, res);
        assert.equal(res.code, admin ? 200 : 403);
      }
    }
    assert.deepEqual(calls.map(args => args[2]), ['weighbridge', 'gate_pass']);
  } finally { service.approveManualMode = original; }
});

test('master selections reject missing drivers and invalid IDs; optional details can be cleared', async () => {
  reset();
  assert.equal((await request('patch /:id', { ...full, driver_id: null, version: 0 })).code, 400);
  assert.equal((await request('patch /:id', { ...full, driver_id: 999, version: 0 })).code, 400);
  assert.equal((await request('patch /:id', { ...full, transporter_id: 999, version: 0 })).code, 400);
  assert.equal((await request('patch /:id', { ...full, buying_center_id: 999, version: 0 })).code, 400);
  assert.equal((await request('patch /:id', { ...full, notes: 'a'.repeat(2001), version: 0 })).code, 400);
  assert.equal((await request('patch /:id', { ...full, transporter_id: 2, buying_center_id: 3, notes: 'Visit office', version: 0 })).code, 200);
  assert.equal(JSON.parse(audit[4]).buying_center_name.new, 'Center');
  record.transporter_id = 2; record.buying_center_id = 3; record.buying_center_name = 'Center';
  assert.equal((await request('patch /:id', { ...full, transporter_name: 'Spoofed', driver_name: 'Spoofed', version: 0 })).code, 200);
  assert.equal(JSON.parse(audit[4]).transporter_name.new, '');
  assert.equal(JSON.parse(audit[4]).buying_center_id.new, null);
  assert.equal(JSON.parse(audit[4]).driver_name, undefined);
});
