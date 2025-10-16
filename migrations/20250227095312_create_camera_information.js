exports.up = function(knex) {
    return knex.schema.alterTable('tos_product_type', (table) => {
        table.integer('packing_type_id').unsigned().nullable();
        table.foreign('packing_type_id')
            .references('id')
            .inTable('tos_packing_type')
            .onDelete('SET NULL')
            .onUpdate('CASCADE');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('tos_product_type', (table) => {
        table.dropForeign('packing_type_id');
        table.dropColumn('packing_type_id');
    });
};

exports.up = function (knex) {
    return knex.schema.createTable('tos_camera_information', (table) => {
        table.increments('id').primary();
        table.string('model', 100).defaultTo('Generic Camera');
        table.string('ip_address').defaultTo('0.0.0.0');
        table.string('rtsp_url', 255).defaultTo('rtsp://localhost:554/stream');
        table.string('status', 20).defaultTo('active');
        table.specificType('location_coordinates', 'POINT').defaultTo(knex.raw('POINT(0,0)'));
        table.jsonb('configuration').defaultTo(JSON.stringify({ resolution: "1920x1080", fps: 30 }));
        table.timestamps(true, true);
    }).then(() => {
        return knex.raw('CREATE INDEX idx_camera_status ON tos_camera_information(status)');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('tos_camera_information');
};