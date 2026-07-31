exports.up = function (knex) {
  return knex.schema.alterTable("tos_product", function (table) {
    table.bigInteger("cms_id").nullable();
    table.unique(["cms_id"], {
      indexName: "tos_product_cms_id_unique",
    });
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("tos_product", function (table) {
    table.dropColumn("cms_id");
  });
};
