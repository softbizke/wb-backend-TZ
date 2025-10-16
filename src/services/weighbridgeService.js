const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");
const weighbridge = require("./serialService");

// Create a connection pool
const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

const getWeights = async (name) => {
  try {
    const query = "SELECT address FROM tos_activity_points WHERE id = $1";
    const result = await pool.query(query, [name]);

    if (result.rows.length === 0) {
      return { message: "Activity type not found" };
    }

    const address = result.rows[0].address;

    const response = await weighbridge.sendReadCommand("10.168.7.66", 4660, "READ");

    console.log("Raw Response:", response);

    const weightMatch = response.match(/(\d+)(?=,kg)/);
    const weight = weightMatch ? parseInt(weightMatch[1], 10) : null;

    if (weight === null) {
      throw new Error("Failed to extract weight from response");
    }

    if (weight === 0) {
      return { weight: 0 };
    }

    const weightInTons = weight / 1000;

    return { weight: weightInTons };
  } catch (error) {
    console.error("Error retrieving weight:", error);
    throw new Error("Server error");
  }
};

module.exports = {
  getWeights,
};
