const fields = ['plate', 'driver_id', 'driver_name', 'driver_phone', 'driver_id_no', 'transporter_id', 'transporter_name', 'transporter_phone', 'buying_center_id', 'buying_center_name', 'notes'];
function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function plateValue(value) {
  if (typeof value !== 'string' || value.length > 255 || /[\x00-\x1f\x7f]/.test(value)) fail('Invalid plate');
  return value.trim().toUpperCase();
}
function idValue(value, label, required = false) {
  if (value == null || value === '') {
    if (required) fail(`Select a ${label}.`);
    return null;
  }
  if (!['string','number'].includes(typeof value) || !/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 2147483647) fail(`Invalid ${label}.`);
  return Number(value);
}
function details(body) {
  const plate = plateValue(body.plate);
  if (!plate) fail('Plate is required.');
  const notes = body.notes ?? '';
  if (typeof notes !== 'string' || notes.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(notes)) fail('Notes must be text of at most 2000 characters.');
  return { plate, driver_id: idValue(body.driver_id, 'driver', true), transporter_id: idValue(body.transporter_id, 'transporter'), buying_center_id: idValue(body.buying_center_id, 'buying center'), notes: notes.trim() };
}
function review(record, action, reason) {
  if (record.status !== 'pending') fail('This gate pass is locked.', 409);
  if (!['approved', 'rejected'].includes(action)) fail('Invalid decision');
  if (action === 'approved' && (!record.plate || !record.driver_id || !record.driver_name)) fail('Plate and a selected driver are required before approval.');
  if (action === 'rejected' && (typeof reason !== 'string' || !reason.trim() || reason.length > 2000)) fail('A rejection reason is required (maximum 2000 characters).');
}
module.exports = { fields, fail, details, review, plateValue };
