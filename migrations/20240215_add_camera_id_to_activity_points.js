exports.up = function (knex) {
    return knex.schema.alterTable('tos_activity_points', (table) => {
        table.integer('camera_id').unsigned().nullable();
        table.foreign('camera_id')
            .references('id')
            .inTable('tos_camera_information')
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('tos_activity_points', (table) => {
        table.dropForeign('camera_id');
        table.dropColumn('camera_id');
    });
};
