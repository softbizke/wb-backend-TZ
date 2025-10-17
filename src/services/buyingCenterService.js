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

const createOrUpdateBuyingCenter = async (title, isactive) => {
  try {
    const checkQuery = "SELECT * FROM tos_buying_center WHERE title = $1";
    const result = await pool.query(checkQuery, [title]);

    if (result.rows.length === 0) {
      const insertQuery = `
        INSERT INTO tos_buying_center (title, isactive)
        VALUES ($1, $2)
      `;
      await pool.query(insertQuery, [title, isactive]);
      return { success: true, message: "Buying Center created successfully" };
    } else {
      const updateQuery = `
        UPDATE tos_buying_center
        SET isactive = $1, updated_at = CURRENT_TIMESTAMP
        WHERE title = $2
      `;
      await pool.query(updateQuery, [isactive, title]);
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

    if (search) {
      query += " WHERE title ILIKE $1";
      params.push(`%${search}%`);
    }

    query += " ORDER BY title ASC";
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving buying centers:", error);
    throw new Error("Server error");
  }
};

const getOrCreateBuyingCenterByTitle = async (title, isactive) => {
  try {
    const query = "SELECT id FROM tos_buying_center WHERE title = $1";
    const result = await pool.query(query, [title]);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    const insertQuery = `
      INSERT INTO tos_buying_center (title, isactive)
      VALUES ($1, $2)
      RETURNING id
    `;
    const insertResult = await pool.query(insertQuery, [title, isactive]);
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
