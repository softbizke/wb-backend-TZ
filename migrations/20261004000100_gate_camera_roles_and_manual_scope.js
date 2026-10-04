exports.up = async function(knex) {
  await knex.schema.alterTable('tos_camera_information', t => {
    t.string('role').notNullable().defaultTo('weighbridge');
    t.string('device_id').unique();
    t.string('capture_key');
  });
  await knex.raw("ALTER TABLE tos_camera_information ADD CONSTRAINT camera_role_check CHECK (role IN ('weighbridge','gate_pass'))");
  await knex.schema.alterTable('tos_manual_mode', t => {
    t.string('scope').notNullable().defaultTo('weighbridge');
    t.bigInteger('reviewed_by');
    t.text('rejection_reason');
    t.timestamp('reviewed_at', { useTz: true });
    t.index(['user_id', 'scope', 'status']);
  });
  await knex.raw("ALTER TABLE tos_manual_mode ADD CONSTRAINT manual_mode_scope_check CHECK (scope IN ('weighbridge','gate_pass'))");
  await knex.schema.alterTable('tos_gate_passes', t => {
    t.string('source').notNullable().defaultTo('camera');
    t.bigInteger('created_by');
    t.integer('manual_mode_id').references('id').inTable('tos_manual_mode');
  });
  await knex.raw('ALTER TABLE tos_gate_passes ALTER COLUMN camera_id DROP NOT NULL');
};
exports.down = async function(knex) {
  // Refuse rollback when manual records exist instead of discarding their provenance.
  const manual = await knex('tos_gate_passes').whereNull('camera_id').first();
  if (manual) throw new Error('Cannot roll back while manual gate passes exist.');
  const gateSessions = await knex('tos_manual_mode').where({ scope: 'gate_pass' }).first();
  if (gateSessions) throw new Error('Cannot roll back while gate pass manual requests exist.');
  await knex.raw('ALTER TABLE tos_gate_passes ALTER COLUMN camera_id SET NOT NULL');
  await knex.schema.alterTable('tos_gate_passes', t => {
    t.dropColumn('manual_mode_id'); t.dropColumn('created_by'); t.dropColumn('source');
  });
  await knex.raw('ALTER TABLE tos_manual_mode DROP CONSTRAINT manual_mode_scope_check');
  await knex.schema.alterTable('tos_manual_mode', t => {
    t.dropIndex(['user_id','scope','status']); t.dropColumn('scope'); t.dropColumn('reviewed_by'); t.dropColumn('reviewed_at'); t.dropColumn('rejection_reason');
  });
  await knex.raw('ALTER TABLE tos_camera_information DROP CONSTRAINT camera_role_check');
  await knex.schema.alterTable('tos_camera_information', t => {
    t.dropColumn('role'); t.dropColumn('device_id'); t.dropColumn('capture_key');
  });
};
