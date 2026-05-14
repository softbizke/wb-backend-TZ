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

const isValidDestinationType = (type) => {
  return ["internal", "external"].includes(type);
};

const normalizeDestinationType = (type) => {
  return typeof type === "string" ? type.trim().toLowerCase() : type;
};

// Function to create or update destination
const createOrUpdateDestination = async (title, isactive, type) => {
  try {
    const checkQuery = "SELECT * FROM tos_destinations WHERE title = $1";
    const result = await pool.query(checkQuery, [title]);

    if (result.rows.length === 0) {
      const insertQuery = `
        INSERT INTO tos_destinations (title, isactive, type)
        VALUES ($1, $2, $3)
      `;
      await pool.query(insertQuery, [title, isactive, type]);
      return { success: true, message: "Destination created successfully" };
    } else {
      const updateQuery = `
        UPDATE tos_destinations
        SET isactive = $1, type = $2, updated_at = CURRENT_TIMESTAMP
        WHERE title = $3
      `;
      await pool.query(updateQuery, [isactive, type, title]);
      return { success: true, message: "Destination updated successfully" };
    }
  } catch (error) {
    console.error("Error creating/updating destination:", error);
    throw new Error("Server error");
  }
};

// Get all destinations
const getAllDestinations = async (search, type) => {
  try {
    let query = "SELECT * FROM tos_destinations";
    const params = [];
    const conditions = [];

    if (search && search.trim() !== "") {
      params.push(`%${search}%`);
      conditions.push(`title ILIKE $${params.length}`);
    }

    if (type && type !== "all") {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY title ASC";
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving destinations:", error);
    throw new Error("Server error");
  }
};

// Get or create destination by title
const getOrCreateDestinationByTitle = async (title, isactive, type) => {
  try {
    const query = "SELECT id FROM tos_destinations WHERE title = $1";
    const result = await pool.query(query, [title]);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    const insertQuery = `
      INSERT INTO tos_destinations (title, isactive, type)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const insertResult = await pool.query(insertQuery, [title, isactive, type]);
    return insertResult.rows[0].id;
  } catch (error) {
    console.error("Error getting/creating destination:", error);
    throw new Error("Server error");
  }
};

module.exports = {
  isValidDestinationType,
  normalizeDestinationType,
  createOrUpdateDestination,
  getAllDestinations,
  getOrCreateDestinationByTitle,
};
