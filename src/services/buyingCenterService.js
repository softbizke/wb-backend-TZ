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

const createOrUpdateBuyingCenter = async (name, is_active) => {
  try {
    const checkQuery = "SELECT * FROM tos_buying_center WHERE name = $1";
    const result = await pool.query(checkQuery, [name]);

    if (result.rows.length === 0) {
      const insertQuery = `
        INSERT INTO tos_buying_center (name, is_active)
        VALUES ($1, $2)
      `;
      await pool.query(insertQuery, [name, is_active]);
      return { success: true, message: "Buying Center created successfully" };
    } else {
      const updateQuery = `
        UPDATE tos_buying_center
        SET is_active = $1, updated_at = CURRENT_TIMESTAMP
        WHERE name = $2
      `;
      await pool.query(updateQuery, [is_active, name]);
      return { success: true, message: "Buying Center updated successfully" };
    }
  } catch (error) {
    console.error("Error creating/updating buying center:", error);
    throw new Error("Server error");
  }
};

const getAllBuyingCenters = async (search) => {
  try {
    let query = "SELECT * FROM tos_buying_center";
    const params = [];

    if (search && search.trim() !== "") {
      query += " WHERE name ILIKE $1";
      params.push(`%${search}%`);
    }

    query += " ORDER BY name ASC";
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving buying centers:", error);
    throw new Error("Server error");
  }
};

const getOrCreateBuyingCenterByTitle = async (name, is_active) => {
  try {
    const query = "SELECT id FROM tos_buying_center WHERE name = $1";
    const result = await pool.query(query, [name]);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    const insertQuery = `
      INSERT INTO tos_buying_center (name, is_active)
      VALUES ($1, $2)
      RETURNING id
    `;
    const insertResult = await pool.query(insertQuery, [name, is_active]);
    return insertResult.rows[0].id;
  } catch (error) {
    console.error("Error getting/creating buying center:", error);
    throw new Error("Server error");
  }
};



module.exports = {
  createOrUpdateBuyingCenter,
  getAllBuyingCenters,
  getOrCreateBuyingCenterByTitle,
};
