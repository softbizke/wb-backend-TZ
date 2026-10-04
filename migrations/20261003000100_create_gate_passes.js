exports.up = async function(knex) {
  await knex.schema.createTable('tos_gate_passes', t => {
    t.bigIncrements('id');
    t.string('camera_id').notNullable();
    t.timestamp('captured_at', { useTz: true }).notNullable();
    t.string('original_plate').notNullable();
    t.string('plate').notNullable();
    t.string('driver_name').notNullable().defaultTo('');
    t.string('driver_phone').notNullable().defaultTo('');
    t.string('driver_id_no').notNullable().defaultTo('');
    t.string('transporter_name').notNullable().defaultTo('');
    t.string('transporter_phone').notNullable().defaultTo('');
    t.string('status').notNullable().defaultTo('pending');
    t.integer('version').notNullable().defaultTo(0);
    t.bigInteger('reviewed_by');
    t.string('reviewer_name');
    t.timestamp('reviewed_at', { useTz: true });
    t.text('rejection_reason');
    t.timestamps(true, true);
    t.unique(['camera_id', 'captured_at']);
    t.index(['status', 'captured_at']);
  });
  await knex.raw("ALTER TABLE tos_gate_passes ADD CONSTRAINT gate_pass_status CHECK (status IN ('pending', 'approved', 'rejected'))");
  await knex.schema.createTable('tos_gate_pass_audit', t => {
    t.bigIncrements('id');
    t.bigInteger('gate_pass_id').notNullable().references('id').inTable('tos_gate_passes');
    t.bigInteger('user_id').notNullable();
    t.string('user_name').notNullable();
    t.string('action').notNullable();
    t.jsonb('changes').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('gate_pass_id');
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTable('tos_gate_pass_audit');
  await knex.schema.dropTable('tos_gate_passes');
};
