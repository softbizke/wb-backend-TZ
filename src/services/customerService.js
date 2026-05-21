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

const isNumericId = (value) => {
  return (
    typeof value === "number" ||
    (typeof value === "string" &&
      value.trim() !== "" &&
      /^\d+$/.test(value.trim()))
  );
};

const getDefaultCustomerTypeId = async (db) => {
  const result = await db.query(`
    SELECT id
    FROM tos_customer_type
    WHERE isactive = true
    ORDER BY id ASC
    LIMIT 1
  `);

  return result.rows.length > 0 ? result.rows[0].id : null;
};

const resolveCustomerId = async (dbClient, customer) => {
  if (customer === undefined || customer === null || customer === "") {
    return null;
  }

  const db = dbClient || pool;

  if (isNumericId(customer)) {
    const result = await db.query(
      "SELECT id FROM tos_customer WHERE id = $1 AND isactive = true",
      [customer],
    );

    if (result.rows.length === 0) {
      throw new Error("Customer not found or inactive");
    }

    return result.rows[0].id;
  }

  if (typeof customer === "string") {
    const name = customer.trim();
    if (!name) return null;

    const existing = await db.query(
      `
        SELECT id
        FROM tos_customer
        WHERE LOWER(name) = LOWER($1) AND isactive = true
        LIMIT 1
      `,
      [name],
    );

    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }

    const customerTypeId = await getDefaultCustomerTypeId(db);
    const created = await db.query(
      `
        INSERT INTO tos_customer (name, isactive, customer_type_id)
        VALUES ($1, true, $2)
        RETURNING id
      `,
      [name, customerTypeId],
    );

    return created.rows[0].id;
  }

  return null;
};

// Function to create or update customer type based on name
const createOrUpdateCustomerType = async (name, isactive) => {
  try {
    // Convert the name to uppercase
    const customerTypeName = name.toUpperCase();

    // Check if the customer type already exists
    const checkNameQuery =
      "SELECT * FROM tos_customer_type WHERE LOWER(name) = LOWER($1)";
    const nameResult = await pool.query(checkNameQuery, [customerTypeName]);

    if (nameResult.rows.length > 0) {
      // Customer type exists, update its status
      const updateQuery =
        "UPDATE tos_customer_type SET isactive = $1 WHERE LOWER(name) = LOWER($2)";
      const values = [isactive, customerTypeName];

      // Execute the update query
      await pool.query(updateQuery, values);

      return {
        success: true,
        message: "Customer type status updated successfully",
      };
    } else {
      // Customer type doesn't exist, create a new one
      const insertQuery = `
          INSERT INTO tos_customer_type (name, isactive)
          VALUES ($1, $2)
        `;
      const values = [customerTypeName, isactive];

      // Execute the insert query
      await pool.query(insertQuery, values);

      return { success: true, message: "Customer type created successfully" };
    }
  } catch (error) {
    console.error("Error creating or updating customer type:", error);
    throw new Error("Server error");
  }
};

// Function to create or update customer
const createOrUpdateCustomer = async (name, isactive, customerTypeName) => {
  try {
    // Convert customer type name to uppercase
    //const customerTypeNameUpper = customerTypeName.toUpperCase();

    // Check if the customer type exists
    const checkCustomerTypeQuery =
      "SELECT id FROM tos_customer_type WHERE id  = $1";
    const customerTypeResult = await pool.query(checkCustomerTypeQuery, [
      customerTypeName,
    ]);

    if (customerTypeResult.rows.length === 0) {
      return { success: false, message: "Customer type not found" };
    }

    const customerTypeId = customerTypeResult.rows[0].id; // Get customer_type_id

    // Check if the customer already exists by name
    const checkCustomerQuery =
      "SELECT * FROM tos_customer WHERE LOWER(name) = LOWER($1)";
    const customerResult = await pool.query(checkCustomerQuery, [name]);

    if (customerResult.rows.length === 0) {
      // Customer doesn't exist, create a new one
      const insertQuery = `
          INSERT INTO tos_customer (name, isactive, customer_type_id)
          VALUES ($1, $2, $3)
        `;
      await pool.query(insertQuery, [name, isactive, customerTypeId]);

      return { success: true, message: "Customer created successfully" };
    } else {
      // Customer exists, update the isactive status or customer_type_id
      const updateQuery = `
          UPDATE tos_customer
          SET isactive = $1, customer_type_id = $2
          WHERE LOWER(name) = LOWER($3)
        `;
      await pool.query(updateQuery, [isactive, customerTypeId, name]);

      return { success: true, message: "Customer updated successfully" };
    }
  } catch (error) {
    console.error("Error creating or updating customer:", error);
    throw new Error("Server error");
  }
};

const updateCustomerById = async (data) => {
  try {
    // Convert customer type name to uppercase
    //const customerTypeNameUpper = customerTypeName.toUpperCase();
    const { id, name, isactive, customer_type_name } = data;
    // Check if the customer type exists
    const checkCustomerTypeQuery =
      "SELECT id FROM tos_customer_type WHERE id  = $1";
    const customerTypeResult = await pool.query(checkCustomerTypeQuery, [
      customer_type_name,
    ]);

    if (customerTypeResult.rows.length === 0) {
      return { success: false, message: "Customer type not found" };
    }

    const customerTypeId = customerTypeResult.rows[0].id; // Get customer_type_id

    //Check if customer exists by id
    const checkCustomerQuery = "SELECT * FROM tos_customer WHERE id = $1";
    const customerResult = await pool.query(checkCustomerQuery, [id]);

    if (customerResult.rows.length === 0) {
      return { success: false, message: "Customer not found" };
    }

    // update the isactive status or customer_type_id
    const updateQuery = `
      UPDATE tos_customer
      SET name = $1, isactive = $2, customer_type_id = $3
      WHERE id = $4
    `;
    await pool.query(updateQuery, [name, isactive, customerTypeId, id]);

    return { success: true, message: "Customer updated successfully" };
  } catch (error) {
    console.error("Error creating or updating customer:", error);
    throw new Error("Server error");
  }
};

const updateCustomerTypeStatus = async (id, isactive) => {
  try {
    const updateQuery = `
      UPDATE tos_customer_type
      SET isactive = $1
      WHERE id = $2
      RETURNING id, name, isactive
    `;
    const result = await pool.query(updateQuery, [isactive, id]);

    if (result.rows.length === 0) {
      return { success: false, message: "Customer type not found" };
    }

    return {
      success: true,
      message: `Customer type ${isactive ? "activated" : "deactivated"} successfully`,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error updating customer type status:", error);
    throw new Error("Server error");
  }
};

const updateCustomerStatus = async (id, isactive) => {
  try {
    const updateQuery = `
      UPDATE tos_customer
      SET isactive = $1
      WHERE id = $2
      RETURNING id, name, isactive
    `;
    const result = await pool.query(updateQuery, [isactive, id]);

    if (result.rows.length === 0) {
      return { success: false, message: "Customer not found" };
    }

    return {
      success: true,
      message: `Customer ${isactive ? "activated" : "deactivated"} successfully`,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error updating customer status:", error);
    throw new Error("Server error");
  }
};

// Function to retrieve all customer types with optional search functionality
const getAllCustomerTypes = async (search, includeInactive = false) => {
  try {
    // Base query to retrieve customer types
    let query = "SELECT * FROM tos_customer_type";
    const queryParams = [];
    const conditions = [];

    // Add a WHERE clause if search parameter is provided
    if (search) {
      queryParams.push(`%${search}%`);
      conditions.push(`name ILIKE $${queryParams.length}`);
    }

    if (!includeInactive) {
      conditions.push("isactive = true");
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Append ORDER BY clause
    query += " ORDER BY name ASC";

    // Execute the query with parameters
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving customer types:", error);
    throw new Error("Server error");
  }
};

// Function to retrieve all customer with optional search functionality
const getAllCustomer = async (search, includeInactive = false) => {
  try {
    // Base query to retrieve customer types
    let query =
      "SELECT cus.id, cus.name,  typ.name  as customer_type, cus.isactive FROM tos_customer cus left join tos_customer_type typ on typ.id = cus.customer_type_id";
    const queryParams = [];
    const conditions = [];

    // Add a WHERE clause if search parameter is provided
    if (search) {
      queryParams.push(`%${search}%`);
      conditions.push(`cus.name ILIKE $${queryParams.length}`);
    }

    if (!includeInactive) {
      conditions.push("cus.isactive = true");
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Append ORDER BY clause
    query += " ORDER BY name ASC";

    // Execute the query with parameters
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving customer types:", error);
    throw new Error("Server error");
  }
};

//get customer by bp_code
const getOrCreateCustomerByCode = async (data) => {
  try {
    const { name, bp_code, customer_type_id, isactive } = data;
    //find customer by bp_code
    let query = "SELECT id FROM tos_customer";
    const queryParams = [];
    if (bp_code) {
      query += " WHERE bp_code ILIKE $1";
      queryParams.push(`%${bp_code}%`);
    }
    let result = await pool.query(query, queryParams);
    //if customer doesn't exist create one
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    //insert the new customer to tos_table data(bp_code,name, customer_type_id, isactive:true)
    const insertQuery = `
      INSERT INTO tos_customer (name, isactive, customer_type_id, bp_code)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const newresult = await pool.query(insertQuery, [
      name,
      isactive,
      customer_type_id,
      bp_code,
    ]);

    //return customer id
    return newresult.rows[0].id;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  createOrUpdateCustomerType,
  createOrUpdateCustomer,
  getAllCustomerTypes,
  getAllCustomer,
  updateCustomerById,
  getOrCreateCustomerByCode,
  updateCustomerTypeStatus,
  updateCustomerStatus,
  resolveCustomerId,
};
