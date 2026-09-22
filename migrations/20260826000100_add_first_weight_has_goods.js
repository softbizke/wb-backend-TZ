exports.up = (knex) =>
  knex.schema.alterTable("tos_delivery_orders", (table) => {
    // Nullable preserves the meaning of historical tickets whose cargo state
    // was never recorded explicitly.
    table.boolean("first_weight_has_goods").nullable();
  });

exports.down = (knex) =>
  knex.schema.alterTable("tos_delivery_orders", (table) => {
    table.dropColumn("first_weight_has_goods");
  });
