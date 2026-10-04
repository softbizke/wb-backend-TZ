const net = require('net');
const { GATE_PASS_IP_ADDRESS, GATE_PASS_PORT } = require('../config/printerConfig');
// Dedicated gate pass ESC/POS printer; receipt heading follows the WB ticket.
const clean = value => String(value ?? '').replace(/[\x00-\x1f\x7f]/g, ' ');
function printGatePass(pass) {
  const host = GATE_PASS_IP_ADDRESS?.trim();
  if (!host) throw Object.assign(new Error('Gate pass printer is not configured. Set GATE_PASS_IP_ADDRESS in src/config/printerConfig.js.'), { status: 503 });
  const lines = [
    'P.O. BOX 11074, MWANZA, TANZANIA', 'Phone: 0767461986',
    'GATE PASS TICKET', '--------------------------------',
    `Ticket No: GP-${pass.id}`, `Plate: ${pass.plate}`,
    `Driver: ${pass.driver_name}`, `Driver ID: ${pass.driver_id_no}`,
    `Driver phone: ${pass.driver_phone}`, `Transporter: ${pass.transporter_name || "—"}`,
    `Transporter phone: ${pass.transporter_phone}`,
    `Buying center: ${pass.buying_center_name || "—"}`,
    ...(pass.notes ? [`Notes: ${pass.notes}`] : []),
    `Captured: ${new Date(pass.captured_at).toLocaleString('en-GB', { timeZone: 'Africa/Dar_es_Salaam' })}`,
    `Approved by: ${pass.reviewer_name}`,
    `Approved: ${new Date(pass.reviewed_at).toLocaleString('en-GB', { timeZone: 'Africa/Dar_es_Salaam' })}`,
    'Status: APPROVED', '--------------------------------', '', '', ''
  ];
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port: GATE_PASS_PORT || 9100 });
    socket.setTimeout(10000);
    socket.once('timeout', () => socket.destroy(new Error('Printer timed out')));
    socket.once('error', reject);
    socket.once('connect', () => socket.end(Buffer.concat([
      Buffer.from([0x1b, 0x40]), Buffer.from(lines.map(clean).join('\n') + '\n'), Buffer.from([0x1d, 0x56, 0])
    ]), resolve));
  });
}
module.exports = { printGatePass };
