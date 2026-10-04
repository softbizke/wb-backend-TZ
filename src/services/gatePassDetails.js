const { fail } = require('../utils/gatePassValidation');
// Save master labels with the pass so later master edits cannot change approved tickets.
async function resolveGatePassDetails(client, input) {
  const driver = (await client.query('SELECT * FROM tos_drivers WHERE id=$1 AND is_active=true FOR SHARE', [input.driver_id])).rows[0];
  if (!driver) fail('Selected driver was not found or is inactive.');
  let transporter;
  if (input.transporter_id) {
    transporter = (await client.query('SELECT * FROM tos_transporter WHERE id=$1 AND isactive=true FOR SHARE', [input.transporter_id])).rows[0];
    if (!transporter) fail('Selected transporter was not found or is inactive.');
  }
  let center;
  if (input.buying_center_id) {
    center = (await client.query('SELECT * FROM tos_buying_center WHERE id=$1 AND is_active=true FOR SHARE', [input.buying_center_id])).rows[0];
    if (!center) fail('Selected buying center was not found or is inactive.');
  }
  return { ...input,
    driver_name: driver.name || [driver.first_name, driver.last_name].filter(Boolean).join(' '),
    driver_id_no: driver.id_no || '', driver_phone: driver.phone || '',
    transporter_name: transporter?.name || transporter?.title || '', transporter_phone: transporter?.phone || '',
    buying_center_name: center ? [center.name || center.title, center.village_name].filter(Boolean).join(' - ') : '',
  };
}
module.exports = { resolveGatePassDetails };
