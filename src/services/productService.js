const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");

const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

const updateProductType = async (id, { name, isactive, packing_type_id }) => {
  try {
    const updateQuery = `
      UPDATE tos_product_type 
      SET name = $1, 
          isactive = $2, 
          packing_type_id = $3
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      name.toUpperCase(),
      isactive,
      packing_type_id,
      id,
    ]);

    if (result.rows.length === 0) {
      return { success: false, message: "Product type not found" };
    }

    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error("Error updating product type:", error);
    throw new Error("Server error");
  }
};

const createOrUpdateProductType = async (name, isactive, packing_type_id) => {
  try {
    const productTypeName = name.toUpperCase();

    const checkNameQuery =
      "SELECT * FROM tos_product_type WHERE LOWER(name) = LOWER($1)";
    const nameResult = await pool.query(checkNameQuery, [productTypeName]);

    if (nameResult.rows.length > 0) {
      const updateQuery =
        "UPDATE tos_product_type SET isactive = $1 WHERE LOWER(name) = LOWER($2)";
      const values = [isactive, productTypeName];
      await pool.query(updateQuery, values);

      return {
        success: true,
        message: "Product type status updated successfully",
      };
    } else {
      const insertQuery = `
          INSERT INTO tos_product_type (name, isactive, packing_type_id)
          VALUES ($1, $2, $3)
        `;
      const values = [productTypeName, isactive, packing_type_id];

      await pool.query(insertQuery, values);

      return { success: true, message: "Product type created successfully" };
    }
  } catch (error) {
    console.error("Error creating or updating product type:", error);
    throw new Error("Server error");
  }
};

const createOrUpdateProduct = async (name, isactive, productTypeName) => {
  try {
    const checkProductTypeQuery =
      "SELECT id FROM tos_product_type WHERE id = $1";
    const productTypeResult = await pool.query(checkProductTypeQuery, [
      productTypeName,
    ]);

    if (productTypeResult.rows.length === 0) {
      return { success: false, message: "Product type not found" };
    }

    const productTypeId = productTypeResult.rows[0].id;

    const checkProductQuery =
      "SELECT * FROM tos_product WHERE LOWER(name) = LOWER($1)";
    const productResult = await pool.query(checkProductQuery, [name]);

    if (productResult.rows.length === 0) {
      const insertQuery = `
        INSERT INTO tos_product (name, isactive, product_type_id)
        VALUES ($1, $2, $3)
      `;
      await pool.query(insertQuery, [name, isactive, productTypeId]);

      return { success: true, message: "Product created successfully" };
    } else {
      const updateQuery = `
        UPDATE tos_product
        SET isactive = $1, product_type_id = $2
        WHERE LOWER(name) = LOWER($3)
      `;
      await pool.query(updateQuery, [isactive, productTypeId, name]);

      return { success: true, message: "Product updated successfully" };
    }
  } catch (error) {
    console.error("Error creating or updating product:", error);
    throw new Error("Server error");
  }
};

const getAllProductTypes = async (search) => {
  try {
    let query = `
      SELECT 
        pt.*,
        pack.name as packing_type_name 
      FROM tos_product_type pt
      LEFT JOIN tos_packing_type pack ON pack.id = pt.packing_type_id
    `;
    const queryParams = [];

    if (search) {
      query += " WHERE pt.name ILIKE $1";
      queryParams.push(`%${search}%`);
    }

    query += " ORDER BY pt.name ASC";

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving product types:", error);
    throw new Error("Server error");
  }
};

// Function to retrieve all product with optional search functionality
const getAllProducts = async (search) => {
  try {
    // Base query to retrieve customer types
    let query =
      "SELECT prod.id,prod.name, prod.isactive, typ.name as producttype FROM tos_product prod left join tos_product_type typ on typ.id = prod.product_type_id";
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
    console.error("Error retrieving customer types:", error);
    throw new Error("Server error");
  }
};

const getOrCreateProductByCode = async (data) => {
  try {
    let { name, item_code, product_type_id, isactive } = data;
    product_type_id = 1;
    //find customer by item_code
    let query = "SELECT id FROM tos_product";
    const queryParams = [];
    if (item_code) {
      query += " WHERE item_code ILIKE $1";
      queryParams.push(`%${item_code}%`);
    }
    let result = await pool.query(query, queryParams);
    //if customer doesn't exist create one
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    //insert the new customer to tos_table data(item_code,name, product_type_id, isactive:true)
    const insertQuery = `
    INSERT INTO tos_product (name, isactive, product_type_id, item_code)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;
    const newresult = await pool.query(insertQuery, [
      name,
      isactive,
      product_type_id,
      item_code,
    ]);

    //return customer id
    return newresult.rows[0].id;
  } catch (error) {
    throw new Error(error);
  }
};

const createOrUpdateWheatType = async (name, isactive) => {
  try {
    const vesselTypeName = name.toUpperCase();

    // Check if the vessel type already exists
    const checkNameQuery =
      "SELECT * FROM tos_wheat_type WHERE LOWER(name) = LOWER($1)";
    const nameResult = await pool.query(checkNameQuery, [vesselTypeName]);

    if (nameResult.rows.length > 0) {
      // Vessel type exists, update its status
      const updateQuery =
        "UPDATE tos_wheat_type SET status = $1 WHERE LOWER(name) = LOWER($2)";
      await pool.query(updateQuery, [isactive, vesselTypeName]);
      return {
        success: true,
        message: "Wheat type status updated successfully",
      };
    } else {
      // Vessel type doesn't exist, create a new one
      const insertQuery = `
        INSERT INTO tos_wheat_type (name, status)
        VALUES ($1, $2)
      `;
      await pool.query(insertQuery, [vesselTypeName, isactive]);
      return { success: true, message: "Wheat Type created successfully" };
    }
  } catch (error) {
    console.error("Error creating or updating wheat type:", error);
    throw new Error("Server error");
  }
};
const getAllWheatTypes = async (search) => {
  try {
    let query = "SELECT * FROM tos_wheat_type";
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
module.exports = {
  createOrUpdateProductType,
  createOrUpdateProduct,
  getAllProductTypes,
  getAllProducts,
  updateProductType,
  getOrCreateProductByCode,
  createOrUpdateWheatType,
  getAllWheatTypes,
};
