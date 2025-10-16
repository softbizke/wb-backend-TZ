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

// Function to create or update vessel type based on name
const createOrUpdateVesselType = async (name, isactive) => {
  try {
    const vesselTypeName = name.toUpperCase();

    // Check if the vessel type already exists
    const checkNameQuery = "SELECT * FROM tos_vessel_type WHERE LOWER(name) = LOWER($1)";
    const nameResult = await pool.query(checkNameQuery, [vesselTypeName]);

    if (nameResult.rows.length > 0) {
      // Vessel type exists, update its status
      const updateQuery = "UPDATE tos_vessel_type SET isactive = $1 WHERE LOWER(name) = LOWER($2)";
      await pool.query(updateQuery, [isactive, vesselTypeName]);
      return { success: true, message: "Vessel type status updated successfully" };
    } else {
      // Vessel type doesn't exist, create a new one
      const insertQuery = `
        INSERT INTO tos_vessel_type (name, isactive)
        VALUES ($1, $2)
      `;
      await pool.query(insertQuery, [vesselTypeName, isactive]);
      return { success: true, message: "Vessel type created successfully" };
    }
  } catch (error) {
    console.error("Error creating or updating vessel type:", error);
    throw new Error("Server error");
  }
};

// Function to create or update vessel
const createOrUpdateVessel = async (name, isactive, vesselType_id) => {
  try {
    // Check if the vessel type exists
    const checkVesselTypeQuery = "SELECT id FROM tos_vessel_type WHERE id = $1";
    const vesselTypeResult = await pool.query(checkVesselTypeQuery, [vesselType_id]);

    if (vesselTypeResult.rows.length === 0) {
      return { success: false, message: "Vessel type not found" };
    }

    const vesselTypeId = vesselTypeResult.rows[0].id;

    // Check if the vessel already exists by name
    const checkVesselQuery = "SELECT * FROM tos_vessel WHERE LOWER(name) = LOWER($1)";
    const vesselResult = await pool.query(checkVesselQuery, [name]);

    if (vesselResult.rows.length === 0) {
      // Vessel doesn't exist, create a new one
      const insertQuery = `
        INSERT INTO tos_vessel (name, isactive, vessel_type_id)
        VALUES ($1, $2, $3)
      `;
      await pool.query(insertQuery, [name, isactive, vesselTypeId]);
      return { success: true, message: "Vessel created successfully" };
    } else {
      // Vessel exists, update the isactive status or vessel_type_id
      const updateQuery = `
        UPDATE tos_vessel
        SET isactive = $1, vessel_type_id = $2
        WHERE LOWER(name) = LOWER($3)
      `;
      await pool.query(updateQuery, [isactive, vesselTypeId, name]);
      return { success: true, message: "Vessel updated successfully" };
    }
  } catch (error) {
    console.error("Error creating or updating vessel:", error);
    throw new Error("Server error");
  }
};

// Function to retrieve all vessel types with optional search functionality
const getAllVesselTypes = async (search) => {
  try {
    let query = "SELECT * FROM tos_vessel_type";
    const queryParams = [];

    if (search) {
      query += " WHERE name ILIKE $1";
      queryParams.push(`%${search}%`);
    }

    query += " ORDER BY name ASC";
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving vessel types:", error);
    throw new Error("Server error");
  }
};

// Function to retrieve all vessels with optional search functionality
const getAllVessels = async (search) => {
  try {
    let query = `
      SELECT v.id, v.name, v.isactive, vt.name AS vesseltype 
      FROM tos_vessel v
      LEFT JOIN tos_vessel_type vt ON vt.id = v.vessel_type_id
    `;
    const queryParams = [];

    if (search) {
      query += " WHERE v.name ILIKE $1";
      queryParams.push(`%${search}%`);
    }

    query += " ORDER BY v.name ASC";
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving vessels:", error);
    throw new Error("Server error");
  }
};

module.exports = {
  createOrUpdateVesselType,
  createOrUpdateVessel,
  getAllVesselTypes,
  getAllVessels,
};
