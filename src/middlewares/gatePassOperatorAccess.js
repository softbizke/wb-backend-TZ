const { Pool } = require('pg');
const { dbConfig } = require('../config/dbConfig');
const { authenticateToken } = require('./auth');
const pool = new Pool(dbConfig);
const publicPosts = new Set(['/validateuser/v1','/sendverificationcode/v1','/verifycode/v1','/resetuserpassword/v1','/anprEvents/v1','/gate-passes/capture']);
function allowedGateOperatorRequest(req) {
  const path = req.path.replace(/\/+$/, '') || '/';
  if (req.method === 'GET' && ['/currentuser/v1','/driver/list/v1','/transporter/list/v1','/buyingcenter/list/v1','/gate-passes'].includes(path)) return true;
  if (req.method === 'GET' && /^\/gate-passes\/\d+$/.test(path)) return true;
  if (req.method === 'PATCH' && /^\/gate-passes\/\d+$/.test(path)) return true;
  if (req.method === 'POST' && (path === '/gate-passes/manual' || /^\/gate-passes\/\d+\/print$/.test(path))) return true;
  if ((req.method === 'GET' && path === '/manual-mode/status') || (req.method === 'POST' && path === '/manual-mode/request')) {
    return (req.body?.scope ?? req.query?.scope) === 'gate_pass';
  }
  return false;
}
async function restrictRole(req,res,next) {
  try {
    const { rows } = await pool.query(`SELECT u.isactive,t.name,t.isactive AS role_active FROM tos_users u LEFT JOIN tos_user_type t ON t.id=u.user_type_id WHERE u.id=$1`, [req.user.id]);
    const user = rows[0];
    if (!user || !user.isactive || user.role_active === false) return res.status(403).json({ message: 'Your account or role is inactive.' });
    if ((user.name || '').trim().toLowerCase() === 'gate pass operator' && !allowedGateOperatorRequest(req)) {
      return res.status(403).json({ message: 'Gate Pass Operators can only view, create, edit and print gate passes.' });
    }
    next();
  } catch (error) { next(error); }
}
// Mounted before every API router, including legacy routes that had no authentication.
function gatePassOperatorAccess(req,res,next) {
  const path = req.path.replace(/\/+$/, '');
  if (req.method === 'POST' && publicPosts.has(path)) return next();
  authenticateToken(req,res,() => restrictRole(req,res,next));
}
module.exports = { gatePassOperatorAccess, allowedGateOperatorRequest, restrictRole };
