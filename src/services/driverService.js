const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");
const { default: axios } = require("axios");
const {
  WEIGHBRIDGE_CMS_API_URL,
  WEIGHBRIDGE_CMS_API_KEY,
} = require("../config/configs");

// Create a connection pool
const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

const isNumericId = (value) => {
  return (
    typeof value === "number" ||
    (typeof value === "string" && value.trim() !== "" && /^\d+$/.test(value.trim()))
  );
};

const resolveDriverId = async (dbClient, driver) => {
  if (driver === undefined || driver === null || driver === "") {
    return null;
  }

  const db = dbClient || pool;

  if (isNumericId(driver)) {
    const result = await db.query(
      "SELECT id FROM tos_drivers WHERE id = $1 AND is_active = true",
      [driver],
    );

    if (result.rows.length === 0) {
      throw new Error("Driver not found or inactive");
    }

    return result.rows[0].id;
  }

  if (typeof driver === "string") {
    const name = driver.trim();
    if (!name) return null;

    const existing = await db.query(
      "SELECT id FROM tos_drivers WHERE LOWER(name) = LOWER($1) AND is_active = true LIMIT 1",
      [name],
    );

    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }

    const created = await db.query(
      `
        WITH driver_token AS (
          SELECT nextval('tos_drivers_id_seq')::text AS value
        )
        INSERT INTO tos_drivers (name, id_no, license_no, is_active)
        SELECT $1, 'AUTO-' || value, 'AUTO-' || value, true
        FROM driver_token
        RETURNING id
      `,
      [name],
    );

    return created.rows[0].id;
  }

  return null;
};

// Function to create or update driver
const createOrUpdateDriver = async (id_no, name, license_no, is_active) => {
  try {
    // Check if the driver already exists by id_no
    const checkDriverQuery = "SELECT * FROM tos_drivers WHERE id_no = $1";
    const driverResult = await pool.query(checkDriverQuery, [id_no]);

    if (driverResult.rows.length === 0) {
      // Driver doesn't exist, create a new one
      const insertQuery = `
          INSERT INTO tos_drivers (name, id_no, license_no, is_active)
          VALUES ($1, $2, $3, $4)
        `;
      await pool.query(insertQuery, [name, id_no, license_no, is_active]);

      return { success: true, message: "Driver created successfully" };
    } else {
      // Driver exists, update the driver's details (name, license_no, is_active)
      const updateQuery = `
          UPDATE tos_drivers
          SET name = $1, license_no = $2, is_active = $3
          WHERE id_no = $4
        `;
      await pool.query(updateQuery, [name, license_no, is_active, id_no]);

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
  const { id, name, phone, is_active, isactive } = data;
  const active = is_active ?? isactive ?? true;

  if (!id && !name) {
    throw new Error("Driver ID or name is required");
  }

  let query = "SELECT id FROM tos_drivers WHERE ";
  const queryParams = [];

  if (id) {
    query += "id_no = $1";
    queryParams.push(id);
  } else {
    query += "LOWER(name) = LOWER($1)";
    queryParams.push(name.trim());
  }

  const result = await pool.query(query, queryParams);

  if (result.rows.length > 0) {
    return result.rows[0].id;
  }

  const insertQuery = `
    INSERT INTO tos_drivers (name, id_no, license_no, is_active)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;

  const insertResult = await pool.query(insertQuery, [
    name?.trim(),
    id || null,
    phone || null,
    active,
  ]);

  return insertResult.rows[0].id;
};

module.exports = {
  createOrUpdateDriver,
  getAllDrivers,
  getOrCreateDriverByID,
  resolveDriverId,
};
