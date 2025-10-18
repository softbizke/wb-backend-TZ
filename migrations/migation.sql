-- 1️⃣ Transporter Table
CREATE TABLE tos_transporter (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  isactive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2️⃣ Buying Center Table
CREATE TABLE tos_buying_center (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  isactive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3️⃣ Purchase Type Table
CREATE TABLE tos_purchase_type (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  isactive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE tos_suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) UNIQUE NOT NULL,
  isactive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tos_delivery_orders
-- Remove old column
DROP COLUMN IF EXISTS stock_transfer_code,

-- Add new foreign key columns
ADD COLUMN transporter_id BIGINT,
ADD COLUMN buying_center_id BIGINT,
ADD COLUMN supplier_id BIGINT,
ADD COLUMN purchase_type_id BIGINT,

-- Add foreign key constraints
ADD CONSTRAINT fk_delivery_orders_transporter
    FOREIGN KEY (transporter_id)
    REFERENCES tos_transporter(id)
    ON DELETE SET NULL,

ADD CONSTRAINT fk_delivery_orders_buying_center
    FOREIGN KEY (buying_center_id)
    REFERENCES tos_buying_center(id)
    ON DELETE SET NULL,

ADD CONSTRAINT fk_delivery_orders_supplier
    FOREIGN KEY (supplier_id)
    REFERENCES tos_supplier(id)
    ON DELETE SET NULL,

ADD CONSTRAINT fk_delivery_orders_purchase_type
    FOREIGN KEY (purchase_type_id)
    REFERENCES tos_purchase_type(id)
    ON DELETE SET NULL;


ALTER TABLE tos_finished_orders
ADD COLUMN source VARCHAR(255),
ADD COLUMN destination VARCHAR(255),
ADD COLUMN transaction_type VARCHAR(100);
