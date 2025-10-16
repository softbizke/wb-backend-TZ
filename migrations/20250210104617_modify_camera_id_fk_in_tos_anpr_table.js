/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTableIfNotExists("tos_activity_points", (table) => {
            table.increments("id").primary();
            table.string("name").notNullable();
            table.string("location").notNullable();
            table.string("ip_address").notNullable();
            table.timestamps(true, true);
        })
        .createTableIfNotExists("tos_anpr_table", (table) => {
            table.increments("id").primary();
            table.string("plate_number").notNullable();
            table.string("snapshot_path");
            table.integer("camera_id").unsigned().notNullable();
            table.foreign("camera_id")
                .references("id")
                .inTable("tos_activity_points")
                .onDelete("CASCADE")
                .onUpdate("CASCADE");
            table.timestamps(true, true);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists("tos_anpr_table")
        .dropTableIfExists("tos_activity_points");
};
