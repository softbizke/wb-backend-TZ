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

// Function to create or update driver
const createOrUpdateDriver = async (id_no, name, license_no, isactive) => {
  try {
    // Check if the driver already exists by id_no
    const checkDriverQuery = "SELECT * FROM tos_drivers WHERE id_no = $1";
    const driverResult = await pool.query(checkDriverQuery, [id_no]);

    if (driverResult.rows.length === 0) {
      // Driver doesn't exist, create a new one
      const insertQuery = `
          INSERT INTO tos_drivers (name, id_no, license_no, isactive)
          VALUES ($1, $2, $3, $4)
        `;
      await pool.query(insertQuery, [name, id_no, license_no, isactive]);

      return { success: true, message: "Driver created successfully" };
    } else {
      // Driver exists, update the driver's details (name, license_no, isactive)
      const updateQuery = `
          UPDATE tos_drivers
          SET name = $1, license_no = $2, isactive = $3
          WHERE id_no = $4
        `;
      await pool.query(updateQuery, [name, license_no, isactive, id_no]);

      return { success: true, message: "Driver updated successfully" };
    }
  } catch (error) {
    console.error("Error creating or updating driver:", error);
    throw new Error("Server error");
  }
};

// Function to retrieve all Drivers with optional search functionality
const getAllDrivers = async (search) => {
  try {
    // Base query to retrieve customer types
    let query = "SELECT * FROM tos_drivers";
    const queryParams = [];

    // Add a WHERE clause if search parameter is provided
    if (search) {
      query += " WHERE name LIKE $1";
      queryParams.push(`%${search}%`);
    }

    // Append ORDER BY clause
    query += " ORDER BY name ASC";
    //console.log(query);
    // Execute the query with parameters
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving customer types:", error);
    throw new Error("Server error");
  }
};

const getOrCreateDriverByID = async (data) => {
  const { id, name, phone, isactive } = data;
  // Validate the input field
  try {
    let query = "SELECT id FROM tos_drivers";
    const queryParams = [];
    if (id) {
      query += " WHERE id_no = $1";
      queryParams.push(id);
    }
    let result = await pool.query(query, queryParams);
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    const insertQuery = `
        INSERT INTO tos_drivers (name, id_no, license_no, isactive)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
    const insertResult = await pool.query(insertQuery, [
      name,
      id,
      phone,
      isactive,
    ]);
    const newDriverId = insertResult.rows[0].id;
    return newDriverId;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  createOrUpdateDriver,
  getAllDrivers,
  getOrCreateDriverByID,
};
