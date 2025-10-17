const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");
const { get } = require("../routes/eventRoutes");

// Create a connection pool
const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

const createOrUpdatePurchaseType = async (title, isactive) => {
  try {
    const checkQuery = "SELECT * FROM tos_purchase_type WHERE title = $1";
    const result = await pool.query(checkQuery, [title]);

    if (result.rows.length === 0) {
      const insertQuery = `
        INSERT INTO tos_purchase_type (title, isactive)
        VALUES ($1, $2)
      `;
      await pool.query(insertQuery, [title, isactive]);
      return { success: true, message: "Purchase Type created successfully" };
    } else {
      const updateQuery = `
        UPDATE tos_purchase_type
        SET isactive = $1, updated_at = CURRENT_TIMESTAMP
        WHERE title = $2
      `;
      await pool.query(updateQuery, [isactive, title]);
      return { success: true, message: "Purchase Type updated successfully" };
    }
  } catch (error) {
    console.error("Error creating/updating purchase type:", error);
    throw new Error("Server error");
  }
};

const getAllPurchaseTypes = async (search) => {
  try {
    let query = "SELECT * FROM tos_purchase_type";
    const params = [];

    if (search && search.trim() !== "") {
      query += " WHERE title ILIKE $1";
      params.push(`%${search}%`);
    }

    query += " ORDER BY title ASC";
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving purchase types:", error);
    throw new Error("Server error");
  }
};

const getOrCreatePurchaseTypeByTitle = async (title, isactive) => {
  try {
    const query = "SELECT id FROM tos_purchase_type WHERE title = $1";
    const result = await pool.query(query, [title]);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    const insertQuery = `
      INSERT INTO tos_purchase_type (title, isactive)
      VALUES ($1, $2)
      RETURNING id
    `;
    const insertResult = await pool.query(insertQuery, [title, isactive]);
    return insertResult.rows[0].id;
  } catch (error) {
    console.error("Error getting/creating purchase type:", error);
    throw new Error("Server error");
  }
};



module.exports = {
  createOrUpdatePurchaseType,
  getAllPurchaseTypes,
  getOrCreatePurchaseTypeByTitle,
};
