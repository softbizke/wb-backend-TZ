/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("tos_product_weight_limits", function (table) {
    table.increments("id").primary();
    table.string("weight").notNullable();
    table.decimal("min", 8, 3).notNullable();
    table.decimal("max", 8, 3).notNullable();
    table.decimal("stable", 8, 3).notNullable();
    table.decimal("size",8,3).nullable();
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });
};

/**weight
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("tos_product_weight_limits");
};
