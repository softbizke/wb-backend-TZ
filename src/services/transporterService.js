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

// Function to create or update transporter
const createOrUpdateTransporter = async (title, isactive) => {
  try {
    const checkQuery = "SELECT * FROM tos_transporter WHERE title = $1";
    const result = await pool.query(checkQuery, [title]);

    if (result.rows.length === 0) {
      const insertQuery = `
        INSERT INTO tos_transporter (title, isactive)
        VALUES ($1, $2)
      `;
      await pool.query(insertQuery, [title, isactive]);
      return { success: true, message: "Transporter created successfully" };
    } else {
      const updateQuery = `
        UPDATE tos_transporter
        SET isactive = $1, updated_at = CURRENT_TIMESTAMP
        WHERE title = $2
      `;
      await pool.query(updateQuery, [isactive, title]);
      return { success: true, message: "Transporter updated successfully" };
    }
  } catch (error) {
    console.error("Error creating/updating transporter:", error);
    throw new Error("Server error");
  }
};

// Get all transporters
const getAllTransporters = async (search) => {
  try {
    let query = "SELECT * FROM tos_transporter";
    const params = [];

    if (search) {
      query += " WHERE title ILIKE $1";
      params.push(`%${search}%`);
    }

    query += " ORDER BY title ASC";
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving transporters:", error);
    throw new Error("Server error");
  }
};

// Get or create transporter by title
const getOrCreateTransporterByTitle = async (title, isactive) => {
  try {
    const query = "SELECT id FROM tos_transporter WHERE title = $1";
    const result = await pool.query(query, [title]);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    const insertQuery = `
      INSERT INTO tos_transporter (title, isactive)
      VALUES ($1, $2)
      RETURNING id
    `;
    const insertResult = await pool.query(insertQuery, [title, isactive]);
    return insertResult.rows[0].id;
  } catch (error) {
    console.error("Error getting/creating transporter:", error);
    throw new Error("Server error");
  }
};


module.exports = {
  createOrUpdateTransporter,
  getAllTransporters,
  getOrCreateTransporterByTitle,
};
