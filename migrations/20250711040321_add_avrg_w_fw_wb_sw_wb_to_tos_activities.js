/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  //add avrg_w, fw_wb, sw_wb to tos_activities
  return knex.schema.alterTable("tos_activities", function (table) {
    table.float("avrg_w").nullable();
    table
      .integer("fw_wb")
      .nullable()
      .unsigned()
      .references("id")
      .inTable("tos_activity_points")
      .onDelete("SET NULL");
    table
      .integer("sw_wb")
      .nullable()
      .unsigned()
      .references("id")
      .inTable("tos_activity_points")
      .onDelete("SET NULL");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  //roollback changes
  return knex.schema.alterTable("tos_activities", function (table) {
    table.dropColumn("avrg_w");
    table.dropColumn("fw_wb");
    table.dropColumn("sw_wb");
  });
};
