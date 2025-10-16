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

// Function to create or update paciking type based on name
const createOrUpdatePackingType = async (name, isactive) => {
    try {
      // Convert the name to uppercase
      const packingTypeName = name.toUpperCase();
  
      // Check if the packing type already exists
      const checkNameQuery = "SELECT * FROM tos_packing_type WHERE LOWER(name) = LOWER($1)";
      const nameResult = await pool.query(checkNameQuery, [packingTypeName]);
  
      if (nameResult.rows.length > 0) {
        // Packing type exists, update its status
        const updateQuery = "UPDATE tos_packing_type SET isactive = $1 WHERE LOWER(name) = LOWER($2)";
        const values = [isactive, packingTypeName];
  
        // Execute the update query
        await pool.query(updateQuery, values);
  
        return { success: true, message: "Packing type status updated successfully" };
      } else {
        // Packing type doesn't exist, create a new one
        const insertQuery = `
          INSERT INTO tos_packing_type (name, isactive)
          VALUES ($1, $2)
        `;
        const values = [packingTypeName, isactive];
  
        // Execute the insert query
        await pool.query(insertQuery, values);
  
        return { success: true, message: "Packing type created successfully" };
      }
    } catch (error) {
      console.error("Error creating or updating packing type:", error);
      throw new Error("Server error");
    }
  };

    // Function to create or update packing
  const createOrUpdatePacking = async (name, isactive, packingTypeName) => {
    try {
      // Check if the packing type exists
      const checkPackingTypeQuery = "SELECT id FROM tos_packing_type WHERE id = $1";
      const packingTypeResult = await pool.query(checkPackingTypeQuery, [packingTypeName]);
  
      if (packingTypeResult.rows.length === 0) {
        return { success: false, message: "Packing type not found" };
      }
  
      const packingTypeId = packingTypeResult.rows[0].id; // Get packing_type_id
  
      // Check if the packing already exists by name
      const checkPackingQuery = "SELECT * FROM tos_packing WHERE LOWER(name) = LOWER($1)";
      const packingResult = await pool.query(checkPackingQuery, [name]);
  
      if (packingResult.rows.length === 0) {
        // Packing doesn't exist, create a new one
        const insertQuery = `
          INSERT INTO tos_packing (name, isactive, packing_type_id)
          VALUES ($1, $2, $3)
        `;
        await pool.query(insertQuery, [name, isactive, packingTypeId]);
  
        return { success: true, message: "Packing created successfully" };
      } else {
        // Packing exists, update the isactive status or packing_type_id
        const updateQuery = `
          UPDATE tos_packing
          SET isactive = $1, packing_type_id = $2
          WHERE LOWER(name) = LOWER($3)
        `;
        await pool.query(updateQuery, [isactive, packingTypeId, name]);
  
        return { success: true, message: "Packing updated successfully" };
      }
    } catch (error) {
      console.error("Error creating or updating packing:", error);
      throw new Error("Server error");
    }
  };

  // Function to retrieve all packing types with optional search functionality
  const getAllPackingTypes = async (search) => {
    try {
      // Base query to retrieve customer types
      let query = "SELECT * FROM tos_packing_type";
      const queryParams = [];
  
      // Add a WHERE clause if search parameter is provided
      if (search) {
        query += " WHERE name ILIKE $1";
        queryParams.push(`%${search}%`);
      }
  
      // Append ORDER BY clause
      query += " ORDER BY name ASC";
  
      // Execute the query with parameters
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error("Error retrieving packing types:", error);
      throw new Error("Server error");
    }
  };

  // Function to retrieve all packing with optional search functionality
  const getAllPacking = async (search) => {
    try {
      // Base query to retrieve packing types
      let query = "SELECT pack.id,pack.name, pack.isactive, typ.name as packingtype FROM tos_packing pack left join tos_packing_type typ on typ.id = pack.packing_type_id";
      const queryParams = [];
  
      // Add a WHERE clause if search parameter is provided
      if (search) {
        query += " WHERE name ILIKE $1";
        queryParams.push(`%${search}%`);
      }
  
      // Append ORDER BY clause
      query += " ORDER BY name ASC";
  
      // Execute the query with parameters
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error("Error retrieving packing:", error);
      throw new Error("Server error");
    }
  };

  module.exports = {
    createOrUpdatePackingType,
    createOrUpdatePacking,
    getAllPackingTypes,
    getAllPacking
  };