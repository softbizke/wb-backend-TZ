const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");

// Create a connection pool
const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

// Function to create or update supplier
const createOrUpdateSupplier = async (name, phone_number, isactive) => {
  try {
    // Check if supplier exists
    const checkQuery = "SELECT * FROM tos_suppliers WHERE phone_number = $1";
    const result = await pool.query(checkQuery, [phone_number]);

    if (result.rows.length === 0) {
      // Create new supplier
      const insertQuery = `
        INSERT INTO tos_suppliers (name, phone_number, isactive)
        VALUES ($1, $2, $3)
      `;
      await pool.query(insertQuery, [name, phone_number, isactive]);
      return { success: true, message: "Supplier created successfully" };
    } else {
      // Update existing supplier
      const updateQuery = `
        UPDATE tos_suppliers
        SET name = $1, isactive = $2, updated_at = CURRENT_TIMESTAMP
        WHERE phone_number = $3
      `;
      await pool.query(updateQuery, [name, isactive, phone_number]);
      return { success: true, message: "Supplier updated successfully" };
    }
  } catch (error) {
    console.error("Error creating/updating supplier:", error);
    throw new Error("Server error");
  }
};

// Get all suppliers
const getAllSuppliers = async (search) => {
  try {
    let query = "SELECT * FROM tos_suppliers";
    const params = [];

    if (search) {
      query += " WHERE name ILIKE $1 OR phone_number ILIKE $1";
      params.push(`%${search}%`);
    }

    query += " ORDER BY name ASC";
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving suppliers:", error);
    throw new Error("Server error");
  }
};

// Get or create supplier by phone number
const getOrCreateSupplierByPhone = async (name, phone_number, isactive) => {
  try {
    const query = "SELECT id FROM tos_suppliers WHERE phone_number = $1";
    const result = await pool.query(query, [phone_number]);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    const insertQuery = `
      INSERT INTO tos_suppliers (name, phone_number, isactive)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const insertResult = await pool.query(insertQuery, [
      name,
      phone_number,
      isactive,
    ]);
    return insertResult.rows[0].id;
  } catch (error) {
    console.error("Error getting/creating supplier:", error);
    throw new Error("Server error");
  }
};

module.exports = {
  createOrUpdateSupplier,
  getAllSuppliers,
  getOrCreateSupplierByPhone,
};
