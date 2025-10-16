exports.up = function(knex) {
    return knex.schema.table('tos_activities', table => {
      table.jsonb('weighbridge_details').defaultTo(null);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('tos_activities', table => {
      table.dropColumn('weighbridge_details');
    });
  };
  