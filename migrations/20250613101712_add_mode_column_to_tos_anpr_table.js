/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("tos_anpr_table", function (table) {
    table
      .enu("mode", ["snapshot", "manual"], {
        useNative: true,
        enumName: "anpr_mode_type",
      })
      .notNullable()
      .defaultTo("snapshot");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable("tos_anpr_table", function (table) {
      table.dropColumn("mode");
    })
    .raw(`DROP TYPE IF EXISTS anpr_mode_type`);
};
