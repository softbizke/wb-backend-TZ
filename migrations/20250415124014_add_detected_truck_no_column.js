/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .alterTable('tos_delivery_orders', (table) => {
            table.string('detected_truck_no', 255).nullable();
        })
        .alterTable('tos_anpr_table', (table) => {
            table.string('detected_truck_no', 255).nullable();
        });
};

exports.down = function(knex) {
    return knex.schema
        .alterTable('tos_delivery_orders', (table) => {
            table.dropColumn('detected_truck_no');
        })
        .alterTable('tos_anpr_table', (table) => {
            table.dropColumn('detected_truck_no');
        });
};


