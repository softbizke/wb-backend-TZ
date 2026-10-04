exports.up = async knex => {
  await knex.schema.alterTable('tos_gate_passes', t => {
    t.integer('driver_id').references('id').inTable('tos_drivers');
    t.integer('transporter_id').references('id').inTable('tos_transporter');
    t.integer('buying_center_id').references('id').inTable('tos_buying_center');
    t.text('buying_center_name').notNullable().defaultTo('');
    t.text('notes').notNullable().defaultTo('');
  });
};
exports.down = async knex => {
  await knex.schema.alterTable('tos_gate_passes', t => {
    t.dropColumn('driver_id'); t.dropColumn('transporter_id'); t.dropColumn('buying_center_id');
    t.dropColumn('buying_center_name'); t.dropColumn('notes');
  });
};
