/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("tos_manual_mode", function (table) {
    table.increments("id").primary();
    table.integer("user_id").unsigned().unique().notNullable();
    table
      .foreign("user_id")
      .references("id")
      .inTable("tos_users")
      .onDelete("CASCADE");
    table
      .enu("status", ["pending", "approved", "rejected"])
      .defaultTo("pending");
    table.text("reason").nullable();
    table.timestamp("expires_at").nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("tos_manual_mode");
};
