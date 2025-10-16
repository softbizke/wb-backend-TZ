exports.up = function(knex) {
    return knex.schema.alterTable('tos_camera_information', (table) => {
        table.string('username', 255).nullable();
        table.string('password', 255).nullable();
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('tos_camera_information', (table) => {
        table.dropColumn('username');
        table.dropColumn('password');
    });
};
