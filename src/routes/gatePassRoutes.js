const router = require('express').Router();
const { Pool } = require('pg');
const { timingSafeEqual } = require('crypto');
const { dbConfig } = require('../config/dbConfig');
const { authenticateToken } = require('../middlewares/auth');
const { fields, fail, details, review, plateValue } = require('../utils/gatePassValidation');
const { printGatePass } = require('../services/gatePassPrinter');
const { resolveGatePassDetails } = require('../services/gatePassDetails');
const pool = new Pool(dbConfig);
const wrap = fn => async (req, res) => {
  try { await fn(req, res); } catch (e) {
    if (!e.status) console.error('Gate pass error:', e);
    res.status(e.status || 500).json({ success: false, message: e.status ? e.message : 'Gate pass operation failed.' });
  }
};
router.post('/capture', wrap(async (req, res) => {
  const camera = req.body.camera_id ?? req.body.Picture?.SnapInfo?.DeviceID;
  const time = req.body.snap_time ?? req.body.Picture?.SnapInfo?.AccurateTime;
  const plate = req.body.reg_no ?? req.body.Picture?.Plate?.PlateNumber ?? '';
  if (typeof camera !== 'string' || !camera || camera.length > 255) fail('Valid camera device ID is required.');
  const configured = await pool.query("SELECT id,capture_key FROM tos_camera_information WHERE device_id=$1 AND role='gate_pass' AND status='active'", [camera]);
  const expected = configured.rows[0]?.capture_key;
  const supplied = req.get('x-camera-key') || '';
  if (!expected || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) fail('Unknown, inactive or unauthorized gate camera.', 403);
  if (!time || !Number.isFinite(Date.parse(time))) fail('Valid snap_time is required.');
  if (typeof plate !== 'string' || plate.length > 255 || /[\x00-\x1f\x7f]/.test(plate)) fail('Invalid plate.');
  const result = await pool.query(`INSERT INTO tos_gate_passes (camera_id,captured_at,original_plate,plate)
    VALUES ($1,$2,$3,$3) ON CONFLICT (camera_id,captured_at) DO NOTHING RETURNING *`, [String(camera), new Date(time), plate]);
  res.status(result.rows.length ? 201 : 200).json({ success: true, duplicate: !result.rows.length, data: result.rows[0] });
}));
router.use(authenticateToken);
router.use(async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT u.id,u.first_name,u.last_name,u.user_type_id,t.name AS role
      FROM tos_users u LEFT JOIN tos_user_type t ON t.id=u.user_type_id WHERE u.id=$1 AND u.isactive=true`, [req.user.id]);
    if (!rows[0]) return res.status(403).json({ message: 'Active user required.' });
    req.actor = rows[0];
    req.actor.name = `${rows[0].first_name} ${rows[0].last_name}`;
    req.actor.can_manage_manual = Number(rows[0].user_type_id) === 1 || ['admin','administrator'].includes((rows[0].role || '').trim().toLowerCase());
    req.actor.can_review = Number(rows[0].user_type_id) === 1 || ['admin','administrator','supervisor'].includes((rows[0].role || '').trim().toLowerCase());
    next();
  } catch (e) { next(e); }
});
router.post('/manual', wrap(async (req, res) => {
  const plate = plateValue(req.body.plate);
  if (!plate) fail('Truck number is required.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const session = await client.query(`SELECT id FROM tos_manual_mode WHERE user_id=$1 AND scope='gate_pass' AND status='approved' AND expires_at>clock_timestamp() ORDER BY id DESC LIMIT 1 FOR UPDATE`, [req.actor.id]);
    if (!session.rows[0]) fail('Approved gate pass manual mode is required.', 403);
    const result = await client.query(`INSERT INTO tos_gate_passes (camera_id,captured_at,original_plate,plate,source,created_by,manual_mode_id) VALUES (NULL,NOW(),'',$1,'manual',$2,$3) RETURNING *`, [plate,req.actor.id,session.rows[0].id]);
    const record = result.rows[0];
    await client.query('INSERT INTO tos_gate_pass_audit (gate_pass_id,user_id,user_name,action,changes) VALUES ($1,$2,$3,$4,$5)', [record.id,req.actor.id,req.actor.name,'manual_created',JSON.stringify({ plate, manual_mode_id: session.rows[0].id })]);
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: record });
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}));
router.get('/', wrap(async (req, res) => {
  const status = req.query.status || '';
  if (status && !['pending','approved','rejected'].includes(status)) fail('Invalid status');
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const search = String(req.query.search || '').slice(0,255);
  const params = [status, `%${search}%`];
  const where = "WHERE ($1='' OR status=$1) AND (plate ILIKE $2 OR driver_name ILIKE $2 OR transporter_name ILIKE $2)";
  const count = await pool.query(`SELECT count(*) FROM tos_gate_passes ${where}`, params);
  const result = await pool.query(`SELECT * FROM tos_gate_passes ${where} ORDER BY captured_at DESC,id DESC LIMIT 25 OFFSET $3`, [...params,(page-1)*25]);
  res.json({ data: result.rows, total: Number(count.rows[0].count), can_review: req.actor.can_review, can_manage_manual: req.actor.can_manage_manual });
}));
router.get('/analytics', wrap(async (req,res) => {
  const { getGatePassAnalytics } = require('../services/gatePassAnalytics');
  const data = await getGatePassAnalytics(pool, req.query.startDate, req.query.endDate);
  res.json({ success: true, data });
}));
router.get('/:id', wrap(async (req,res) => {
  if (!/^\d+$/.test(req.params.id)) fail('Invalid ID');
  const { rows } = await pool.query('SELECT * FROM tos_gate_passes WHERE id=$1',[req.params.id]);
  if (!rows[0]) fail('Gate pass not found.',404);
  const audit = await pool.query('SELECT * FROM tos_gate_pass_audit WHERE gate_pass_id=$1 ORDER BY id',[req.params.id]);
  res.json({ data: rows[0], audit: audit.rows });
}));
async function mutate(req, operation) {
  if (!/^\d+$/.test(req.params.id)) fail('Invalid ID');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM tos_gate_passes WHERE id=$1 FOR UPDATE',[req.params.id]);
    const record = rows[0];
    if (!record) fail('Gate pass not found.',404);
    if (req.body.version !== record.version) fail('Record changed. Refresh before continuing.',409);
    const result = await operation(client,record);
    await client.query('COMMIT');
    return result;
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
async function audit(client,req,action,changes) {
  await client.query('INSERT INTO tos_gate_pass_audit (gate_pass_id,user_id,user_name,action,changes) VALUES ($1,$2,$3,$4,$5)',[req.params.id,req.actor.id,req.actor.name,action,JSON.stringify(changes)]);
}
router.patch('/:id', wrap(async (req,res) => {
  const input = details(req.body);
  const data = await mutate(req,async (client,record) => {
    if (record.status !== 'pending') fail('This gate pass is locked.',409);
    const values = await resolveGatePassDetails(client, input);
    const changes = {};
    fields.forEach(f => { if (record[f] !== values[f]) changes[f] = { old: record[f], new: values[f] }; });
    const result = await client.query(`UPDATE tos_gate_passes SET ${fields.map((f,i)=>`${f}=$${i+2}`).join(',')},version=version+1,updated_at=NOW() WHERE id=$1 RETURNING *`,[record.id,...fields.map(f=>values[f])]);
    await audit(client,req,'edited',changes);
    return result.rows[0];
  });
  res.json({ success: true,data });
}));
router.post('/:id/review',wrap(async (req,res) => {
  if (!req.actor.can_review) fail('Only an admin or supervisor can review gate passes.',403);
  const data = await mutate(req,async (client,record) => {
    review(record,req.body.status,req.body.reason);
    const result = await client.query(`UPDATE tos_gate_passes SET status=$2,rejection_reason=$3,reviewed_by=$4,reviewer_name=$5,reviewed_at=NOW(),updated_at=NOW(),version=version+1 WHERE id=$1 RETURNING *`,[record.id,req.body.status,req.body.status === 'rejected' ? req.body.reason.trim() : null,req.actor.id,req.actor.name]);
    await audit(client,req,req.body.status,{ reason: result.rows[0].rejection_reason });
    return result.rows[0];
  });
  res.json({ success: true,data });
}));
router.post('/:id/print',wrap(async (req,res) => {
  await mutate(req,async (client,record) => {
    if (record.status !== 'approved') fail('Only approved gate passes can be printed.',409);
    await printGatePass(record);
    await audit(client,req,'print_sent',{});
  });
  res.json({ success: true,message: 'Ticket sent to thermal printer.' });
}));
module.exports = router;
