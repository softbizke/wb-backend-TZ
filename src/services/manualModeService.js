const { Pool } = require('pg');
const { dbConfig } = require('../config/dbConfig');
const pool = new Pool(dbConfig);
function scopeValue(scope = 'weighbridge') {
  if (!['weighbridge', 'gate_pass'].includes(scope)) throw Object.assign(new Error('Invalid manual mode scope.'), { status: 400 });
  return scope;
}
const result = (rows, message) => rows.length ? { status: true, message, data: rows[0] } : { status: false, message: 'Request not found, expired, or already reviewed.' };
function futureDate(value) {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime()) || date <= new Date()) throw Object.assign(new Error('A future expiry time is required.'), { status: 400 });
  return date;
}
async function requestManualMode(user_id, reason, scope = 'weighbridge') {
  scopeValue(scope);
  if (typeof reason !== 'string' || !reason.trim() || reason.length > 2000) throw Object.assign(new Error('A reason is required (maximum 2000 characters).'), { status: 400 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Lock the requester to serialize simultaneous requests without preventing independent scopes.
    await client.query('SELECT id FROM tos_users WHERE id=$1 FOR UPDATE', [user_id]);
    const existing = await client.query(`SELECT id FROM tos_manual_mode WHERE user_id=$1 AND scope=$2
      AND (status='pending' OR (status='approved' AND expires_at>NOW())) LIMIT 1`, [user_id,scope]);
    if (existing.rows.length) {
      await client.query('ROLLBACK');
      return { status: false, message: 'You already have an active or pending request for this mode.' };
    }
    const { rows } = await client.query(`INSERT INTO tos_manual_mode (user_id,status,reason,scope,created_at,updated_at) VALUES ($1,'pending',$2,$3,NOW(),NOW()) RETURNING *`, [user_id,reason.trim(),scope]);
    await client.query('COMMIT');
    return result(rows, 'Manual mode requested.');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
async function approveManualMode(id, expires_at, scope = 'weighbridge', reviewer) {
  scopeValue(scope);
  const { rows } = await pool.query(`UPDATE tos_manual_mode SET status='approved',expires_at=$2,reviewed_by=$4,reviewed_at=NOW(),updated_at=NOW() WHERE id=$1 AND scope=$3 AND status='pending' RETURNING *`, [id,futureDate(expires_at),scope,reviewer]);
  return result(rows,'Manual mode approved.');
}
async function rejectManualMode(id, reason, scope = 'weighbridge', reviewer) {
  scopeValue(scope);
  if (reason != null && (typeof reason !== 'string' || reason.length > 2000)) throw Object.assign(new Error('Invalid rejection reason.'), { status: 400 });
  const { rows } = await pool.query(`UPDATE tos_manual_mode SET status='rejected',reviewed_by=$3,rejection_reason=$4,reviewed_at=NOW(),updated_at=NOW() WHERE id=$1 AND scope=$2 AND status='pending' RETURNING *`, [id,scope,reviewer,reason?.trim() || null]);
  return result(rows,'Manual mode rejected.');
}
async function getAllManualModeRequests(scope = 'weighbridge') {
  scopeValue(scope);
  const { rows } = await pool.query(`SELECT m.*,m.id AS request_id,u.phone,u.first_name,u.last_name
    FROM tos_manual_mode m JOIN tos_users u ON u.id=m.user_id WHERE m.scope=$1 ORDER BY m.created_at DESC`, [scope]);
  return { status: true, data: rows };
}
async function isUserInManualMode(user_id, scope = 'weighbridge') {
  scopeValue(scope);
  const { rows } = await pool.query(`SELECT * FROM tos_manual_mode WHERE user_id=$1 AND scope=$2 AND status='approved' AND expires_at>NOW() ORDER BY id DESC LIMIT 1`, [user_id,scope]);
  if (rows.length) return { status: true, message: 'Manual mode is active.', data: rows[0] };
  const pending = await pool.query(`SELECT * FROM tos_manual_mode WHERE user_id=$1 AND scope=$2 AND status='pending' ORDER BY id DESC LIMIT 1`, [user_id,scope]);
  return { status: false, message: pending.rows.length ? 'Manual mode request is pending.' : 'Manual mode is inactive.', data: pending.rows[0] || null };
}
async function postManualModeLog(truck, camera_id, user_id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const session = await client.query(`SELECT id FROM tos_manual_mode WHERE user_id=$1 AND scope='weighbridge' AND status='approved' AND expires_at>clock_timestamp() ORDER BY id DESC LIMIT 1 FOR UPDATE`, [user_id]);
    if (!session.rows.length) {
      await client.query('ROLLBACK');
      return { status: false, message: 'Approved weighbridge manual mode is required.' };
    }
    const point = await client.query('SELECT id FROM tos_activity_points WHERE id=$1 AND isactive=true', [camera_id]);
    if (!point.rows.length || typeof truck !== 'string' || !truck.trim()) {
      await client.query('ROLLBACK');
      return { status: false, message: 'Truck number and active weighbridge are required.' };
    }
    await client.query("INSERT INTO tos_anpr_table (truck_no,camera_id,snap_time,mode) VALUES ($1,$2,NOW(),'manual')", [truck.trim().toUpperCase(),camera_id]);
    await client.query('COMMIT');
    return { status: true, message: 'Manual capture saved.' };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
async function extendManualMode(id, expiry, scope = 'weighbridge') {
  scopeValue(scope);
  const { rows } = await pool.query(`UPDATE tos_manual_mode SET expires_at=$2,updated_at=NOW() WHERE id=$1 AND scope=$3 AND status='approved' AND expires_at>NOW() AND expires_at<$2 RETURNING *`, [id,futureDate(expiry),scope]);
  return result(rows,'Manual mode extended.');
}
async function endManualModeSession(id, scope = 'weighbridge') {
  scopeValue(scope);
  const { rows } = await pool.query("UPDATE tos_manual_mode SET status='ended',expires_at=NOW(),updated_at=NOW() WHERE id=$1 AND scope=$2 AND status='approved' RETURNING *", [id,scope]);
  return result(rows,'Manual mode ended.');
}
module.exports = { scopeValue, requestManualMode, approveManualMode, rejectManualMode, getAllManualModeRequests, isUserInManualMode, postManualModeLog, extendManualMode, endManualModeSession };
