const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
let account = { isactive: true, role_active: true, name: 'Gate Pass Operator' };
const originalLoad = Module._load;
Module._load = function(name,...args) {
  if (name === 'pg') return { Pool: class { async query() { return { rows: account ? [account] : [] }; } } };
  if (name === './auth') return { authenticateToken(req,res,next) { if (!req.user) return res.status(401).json({message:'No token'}); return next(); } };
  return originalLoad.call(this,name,...args);
};
const { allowedGateOperatorRequest, restrictRole, gatePassOperatorAccess } = require('../src/middlewares/gatePassOperatorAccess');
Module._load = originalLoad;
const req = (method,path,scope) => ({ method,path,body: {scope},query: {},user: {id:5} });
async function invoke(middleware,request) {
  return new Promise((resolve,reject) => {
    const res = { code: 200, status(code) { this.code=code;return this; }, json(data) { resolve({code:this.code,data}); } };
    middleware(request,res,error => error ? reject(error) : resolve({code:200}));
  });
}
test('gate operators can use gate records and read required selection lists', () => {
  for (const [method,path] of [['GET','/gate-passes'],['GET','/gate-passes/12'],['PATCH','/gate-passes/12'],['POST','/gate-passes/manual'],['POST','/gate-passes/12/print'],['GET','/currentuser/v1'],['GET','/driver/list/v1'],['GET','/transporter/list/v1'],['GET','/buyingcenter/list/v1']]) assert.ok(allowedGateOperatorRequest(req(method,path)),path);
  assert.ok(allowedGateOperatorRequest(req('POST','/manual-mode/request','gate_pass')));
  assert.ok(allowedGateOperatorRequest(req('GET','/manual-mode/status','gate_pass')));
});
test('gate operators cannot approve, manage users/masters, access WB or dashboard, or use WB manual mode', async () => {
  const denied = [['POST','/gate-passes/12/review'],['GET','/gate-passes/analytics'],['POST','/manual-mode/approve'],['POST','/manual-mode/reject'],['POST','/manual-mode/capture'],['POST','/createusers/v1'],['PUT','/updateusers/v1'],['POST','/createuserstype/v1'],['POST','/createdriver/v1'],['POST','/createorfinddriver/v1'],['GET','/getwbactivity/list/v1'],['POST','/getanprsnapshots/list/v1'],['GET','/summary/order-type/v1'],['GET','/deliveryorders/print/v1'],['POST','/sync/run/v1']];
  for (const [method,path] of denied) assert.equal((await invoke(restrictRole,req(method,path))).code,403,path);
  assert.equal((await invoke(restrictRole,req('POST','/manual-mode/request','weighbridge'))).code,403);
  assert.equal((await invoke(restrictRole,req('GET','/manual-mode/status'))).code,403);
});
test('role is checked from DB and inactive accounts/roles fail closed', async () => {
  account.name='Administrator';
  assert.equal((await invoke(restrictRole,req('GET','/summary/order-type/v1'))).code,200);
  account.name='Gate Pass Operator';
  assert.equal((await invoke(restrictRole,req('GET','/summary/order-type/v1'))).code,403);
  account.role_active=false;
  assert.equal((await invoke(restrictRole,req('GET','/gate-passes'))).code,403);
  account.role_active=true; account.isactive=false;
  assert.equal((await invoke(restrictRole,req('GET','/gate-passes'))).code,403);
  account.isactive=true;
});
test('legacy endpoints cannot bypass role restrictions by omitting authentication', async () => {
  assert.equal((await invoke(gatePassOperatorAccess,{method:'GET',path:'/getwbactivity/list/v1',query:{}})).code,401);
  assert.equal((await invoke(gatePassOperatorAccess,{method:'POST',path:'/gate-passes/manual',body:{}})).code,401);
  assert.equal((await invoke(gatePassOperatorAccess,{method:'POST',path:'/gate-passes/capture'})).code,200);
});
