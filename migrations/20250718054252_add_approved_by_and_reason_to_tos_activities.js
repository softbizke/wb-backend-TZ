/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("tos_activities", function (table) {
    table
      .integer("approved_by")
      .unsigned()
      .references("id")
      .inTable("tos_users")
      .onDelete("SET NULL")
      .nullable();
    table.timestamp("approved_at").nullable();
    table.text("reason").nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("tos_activities", function (table) {
    table.dropColumn("approved_by");
    table.dropColumn("reason");
  });
};
