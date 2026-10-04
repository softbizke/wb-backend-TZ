exports.up = async knex => {
  // Serialize role inserts while repairing sequences left behind by imported IDs.
  await knex.raw('LOCK TABLE tos_user_type IN EXCLUSIVE MODE');
  const existing = await knex('tos_user_type').whereRaw('LOWER(TRIM(name)) = ?', ['gate pass operator']).first();
  if (!existing) {
    await knex.raw(`SELECT setval(
      pg_get_serial_sequence('tos_user_type', 'id'),
      GREATEST(
        COALESCE((SELECT MAX(id) FROM tos_user_type), 0) + 1,
        nextval(pg_get_serial_sequence('tos_user_type', 'id'))
      ), false
    )`);
    await knex('tos_user_type').insert({ name: 'Gate Pass Operator', isactive: true, created_at: knex.fn.now() });
  }
};
exports.down = async knex => {
  const roles = await knex('tos_user_type').whereRaw('LOWER(TRIM(name)) = ?', ['gate pass operator']).select('id');
  if (!roles.length) return;
  const ids = roles.map(row => row.id);
  if (await knex('tos_users').whereIn('user_type_id', ids).first()) throw new Error('Reassign Gate Pass Operators before rolling back this role.');
  await knex('tos_user_type').whereIn('id', ids).del();
};
