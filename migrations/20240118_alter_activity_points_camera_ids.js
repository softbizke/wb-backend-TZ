exports.up = function(knex) {
    return knex.schema.alterTable('tos_activity_points', table => {
      table.dropColumn('camera_id');
      table.specificType('camera_ids', 'integer ARRAY');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.alterTable('tos_activity_points', table => {
      table.dropColumn('camera_ids');
      table.integer('camera_id').references('id').inTable('tos_camera_information');
    });
  };
  