// Filename: 20250408080439_add_bp_code_to_tos_customer.js

exports.up = function (knex) {
    return knex.schema.alterTable('tos_customer', function (table) {
        table.string('bp_code').nullable().defaultTo(null);
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('tos_customer', function (table) {
        table.dropColumn('bp_code');
    });
};
