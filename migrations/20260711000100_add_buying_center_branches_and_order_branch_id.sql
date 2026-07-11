BEGIN;

ALTER TABLE tos_buying_center
  ADD COLUMN IF NOT EXISTS is_multiple_branches BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS tos_buying_center_branches (
  id SERIAL PRIMARY KEY,
  buying_center_id INTEGER NOT NULL
    REFERENCES tos_buying_center(id)
    ON DELETE CASCADE,
  cms_id BIGINT NOT NULL UNIQUE,
  code VARCHAR(255),
  name VARCHAR(255),
  population INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tos_delivery_orders
  ADD COLUMN IF NOT EXISTS branch_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_tos_delivery_orders_branch_id
  ON tos_delivery_orders(branch_id);

COMMIT;
