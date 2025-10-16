/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table("tos_anpr_table", function (table) {
    table.boolean("is_unlicensed").defaultTo(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table("tos_anpr_table", function (table) {
    table.dropColumn("is_unlicensed");
  });
};
