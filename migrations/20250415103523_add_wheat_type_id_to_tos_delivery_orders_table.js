/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return  knex.schema.table("tos_delivery_orders", function (table) {
    table.integer("wheat_type_id").nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    knex.schema.table("tos_delivery_orders", function (table) {
        table.dropColumn("wheat_type_id");
      });
};
