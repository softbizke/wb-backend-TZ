/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table("tos_activities", function (table) {
    table.timestamp("fw_at").nullable();
    table.timestamp("sw_at").nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table("tos_activities", function (table) {
    table.dropColumn("fw_at");
    table.dropColumn("sw_at");
  });
};
