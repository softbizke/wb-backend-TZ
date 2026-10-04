const { Pool } = require('pg');
const { dbConfig } = require('../config/dbConfig');
const pool = new Pool(dbConfig);
async function operatorAccess(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT u.id,u.user_type_id,t.name AS role FROM tos_users u
      LEFT JOIN tos_user_type t ON t.id=u.user_type_id WHERE u.id=$1 AND u.isactive=true`, [req.user.id]);
    if (!rows[0]) return res.status(403).json({ success: false, message: 'Active user required.' });
    const role = (rows[0].role || '').trim().toLowerCase();
    req.operator = { id: rows[0].id, admin: Number(rows[0].user_type_id) === 1 || ['admin','administrator'].includes(role) };
    req.operator.supervisor = req.operator.admin || role === 'supervisor';
    next();
  } catch (error) { next(error); }
}
function adminOnly(req,res,next) {
  if (!req.operator?.admin) return res.status(403).json({ success: false, message: 'Administrator access required.' });
  next();
}
module.exports = { operatorAccess, adminOnly };
