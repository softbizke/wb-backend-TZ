const { fail } = require('../utils/gatePassValidation');
async function getGatePassAnalytics(db, start, end) {
  if (typeof start !== 'string' || typeof end !== 'string' || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(start)>Date.parse(end)) fail('A valid start and end date are required.');
  const { rows } = await db.query(`SELECT
    count(*) FILTER (WHERE status='approved') AS total_issued,
    count(*) FILTER (WHERE status='approved' AND reviewed_at BETWEEN $1 AND $2) AS issued,
    count(*) FILTER (WHERE captured_at BETWEEN $1 AND $2) AS captured,
    count(*) FILTER (WHERE status='pending' AND captured_at BETWEEN $1 AND $2) AS pending,
    count(*) FILTER (WHERE status='rejected' AND reviewed_at BETWEEN $1 AND $2) AS rejected,
    count(*) FILTER (WHERE source='manual' AND captured_at BETWEEN $1 AND $2) AS manual,
    count(*) FILTER (WHERE EXISTS (SELECT 1 FROM tos_gate_pass_audit a WHERE a.gate_pass_id=p.id AND a.action='print_sent' AND a.created_at BETWEEN $1 AND $2)) AS printed
    FROM tos_gate_passes p`, [new Date(start),new Date(end)]);
  return Object.fromEntries(Object.entries(rows[0]).map(([key,value])=>[key,Number(value)]));
}
module.exports = { getGatePassAnalytics };
