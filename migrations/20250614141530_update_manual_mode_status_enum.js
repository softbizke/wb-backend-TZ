/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Step 1: Drop existing CHECK constraint
  await knex.raw(`
    ALTER TABLE tos_manual_mode
    DROP CONSTRAINT IF EXISTS tos_manual_mode_status_check;
  `);

  // Step 2: Change column type to TEXT
  await knex.raw(`
    ALTER TABLE tos_manual_mode
    ALTER COLUMN status TYPE TEXT;
  `);

  // Step 3: Add new CHECK constraint with 'ended' included
  await knex.raw(`
    ALTER TABLE tos_manual_mode
    ADD CONSTRAINT tos_manual_mode_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'ended'));
  `);

  // Step 4: Restore default value
  await knex.raw(`
    ALTER TABLE tos_manual_mode
    ALTER COLUMN status SET DEFAULT 'pending';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Revert: Drop the updated constraint
  await knex.raw(`
    ALTER TABLE tos_manual_mode
    DROP CONSTRAINT IF EXISTS tos_manual_mode_status_check;
  `);

  // Reapply original constraint without 'ended'
  await knex.raw(`
    ALTER TABLE tos_manual_mode
    ADD CONSTRAINT tos_manual_mode_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));
  `);
};
