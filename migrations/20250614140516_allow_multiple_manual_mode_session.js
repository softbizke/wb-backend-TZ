/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.alterTable("tos_manual_mode", function (table) {
    table.dropUnique(["user_id"]);
  });

  // Add 'ended' to the enum for status if it's PostgreSQL ENUM
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tos_manual_mode_status') THEN
        -- Do nothing
      ELSE
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'ended' AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'tos_manual_mode_status'
          )
        ) THEN
          ALTER TYPE tos_manual_mode_status ADD VALUE 'ended';
        END IF;
      END IF;
    END
    $$;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
   await knex.schema.alterTable("tos_manual_mode", function (table) {
    table.unique("user_id");
  });
};
