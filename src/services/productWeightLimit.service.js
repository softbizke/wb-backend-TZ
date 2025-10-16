const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");
const { extractPackKey, cleanProductName } = require("../utils/formaers");

const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

const createOrUpdateProductWeightLimit = async (data) => {
  try {
    const { id, weight, max, min, size, is_active, stable } = data;

    const checkWeightLimitQuery = `
        SELECT * FROM tos_product_weight_limits WHERE id = $1;
      `;
    const weightLimitResult = await pool.query(checkWeightLimitQuery, [id]);

    if (weightLimitResult.rows.length > 0) {
      const updateWeightLimitQuery = `
          UPDATE tos_product_weight_limits 
          SET 
            weight = $1,
            max = $2,
            min = $3,
            stable = $4,
            size = $5,
            is_active = $6
          WHERE id = $7
        `;
      await pool.query(updateWeightLimitQuery, [
        weight,
        max,
        min,
        stable,
        size,
        is_active,
        id,
      ]);
      return { success: true, message: "Weight limit updated successfully" };
    } else {
      const insertWeightLimitQuery = `
          INSERT INTO tos_product_weight_limits 
            (weight, max, min, stable, size, is_active)
          VALUES 
            ($1, $2, $3, $4, $5, $6)
        `;
      await pool.query(insertWeightLimitQuery, [
        weight,
        max,
        min,
        stable,
        size,
        is_active,
      ]);
      return { success: true, message: "Weight limit created successfully" };
    }
  } catch (error) {
    console.error("Error creating or updating product weight limit:", error);
    throw new Error("Server error");
  }
};

// db/productWeightLimits.js

const getAllProductWeightLimits = async (searchTerm = "") => {
  const query = `
      SELECT 
        pwl.id,
        pwl.weight,
        pwl.min,
        pwl.max,
        pwl.stable,
        pwl.size,
        pwl.is_active
      FROM tos_product_weight_limits AS pwl
      WHERE pwl.is_active = TRUE
        AND pwl.weight ILIKE $1
      ORDER BY pwl.created_at DESC
    `;

  try {
    const { rows } = await pool.query(query, [`%${searchTerm}%`]);
    return rows;
  } catch (error) {
    console.error("DB error fetching product weight limits:", error);
    throw new Error("Unable to fetch product weight limits.");
  }
};

// src/db/getProductWeightLimit.js

const getProductWeightLimit = async (name) => {
  try {
    if (!name || typeof name !== "string") {
      throw new Error("Invalid product name");
    }

    const cleanName = cleanProductName(name);
    console.log("TEST NAME", cleanName);
    const query = `
        SELECT * 
        FROM tos_product_weight_limits
        WHERE regexp_replace(weight, '[^0-9]', '', 'g') = regexp_replace($1, '[^0-9]', '', 'g')
          AND is_active = true
        LIMIT 1;
    `
    // const query = `
    //     SELECT * FROM tos_product_weight_limits
    //     WHERE UPPER(weight) LIKE UPPER($1)
    //       AND is_active = true
    //     LIMIT 1
    //   `;

    const result = await pool.query(query, [`%${cleanName}%`]);

    if (result.rows.length === 0) {
      return { success: false, message: "Weight limit not found" };
    }

    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error("Error fetching product weight limit by name:", error);
    throw new Error("Server error");
  }
};

const deleteProductWeightLimit = async (id) => {
  try {
    const query = "DELETE FROM tos_product_weight_limits WHERE id = $1";
    await pool.query(query, [id]);
    return {
      success: true,
      message: "Product weight limit deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting product weight limit:", error);
    throw new Error("Server error");
  }
};
const createWeightLimitsBulk = async (dataArray) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    throw new Error("Data must be a non-empty array");
  }

  const columns = ["weight", "max", "min", "stable", "size", "is_active"];
  const valuesPerRow = columns.length;

  const params = [];
  const placeholders = dataArray.map((row, i) => {
    columns.forEach((col) => {
      params.push(row[col]);
    });
    const startIdx = i * valuesPerRow + 1;
    const placeholderRow = Array.from(
      { length: valuesPerRow },
      (_, j) => `$${startIdx + j}`
    );
    return `(${placeholderRow.join(", ")})`;
  });

  const insertQuery = `
      INSERT INTO tos_product_weight_limits (${columns.join(", ")})
      VALUES ${placeholders.join(", ")}
    `;

  try {
    await pool.query(insertQuery, params);
    return {
      success: true,
      message: `${dataArray.length} weight limits created successfully`,
    };
  } catch (error) {
    console.error("Bulk insert failed:", error);
    throw new Error("Failed to insert weight limits in bulk");
  }
};
module.exports = {
  createOrUpdateProductWeightLimit,
  getAllProductWeightLimits,
  getProductWeightLimit,
  deleteProductWeightLimit,
  createWeightLimitsBulk,
};
