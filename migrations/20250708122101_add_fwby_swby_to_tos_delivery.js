/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("tos_activities", function (table) {
    table
      .integer("fw_by")
      .nullable()
      .unsigned()
      .references("id")
      .inTable("tos_users")
      .onDelete("SET NULL");
    table
      .integer("sw_by")
      .nullable()
      .unsigned()
      .references("id")
      .inTable("tos_users")
      .onDelete("SET NULL");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("tos_activities", function (table) {
    table.dropColumn("fw_by");
    table.dropColumn("sw_by");
  });
};
