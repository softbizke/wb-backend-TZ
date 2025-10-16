/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.all([
    knex.schema.table("tos_delivery_orders", function (table) {
      table.string("old_truck_no").nullable();
    }),
    knex.schema.table("tos_anpr_table", function (table) {
      table.string("old_truck_no").nullable();
    }),
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.all([
    knex.schema.table("tos_delivery_orders", function (table) {
      table.dropColumn("old_truck_no");
    }),
    knex.schema.table("tos_anpr_table", function (table) {
      table.dropColumn("old_truck_no");
    }),
  ]);
};
