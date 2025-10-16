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

const postanprActivitylog = async (
  truck,
  camera_id,
  snap_time,
  is_unlicensed,
  cameraType
) => {
  try {
    const client = await pool.connect();
    const checkActivityPointQuery = `
    SELECT id, name, isactive FROM tos_activity_points WHERE name = $1
  `;

    const activityPointResult = await pool.query(checkActivityPointQuery, [
      camera_id,
    ]);
    if (activityPointResult.rows.length === 0) {
      return { success: false, message: "Activity type not found" };
    }

    const activityPoint = activityPointResult.rows[0];
    if (!activityPoint.isactive) {
      return { success: false, message: "Activity type is inactive" };
    }

    const query = `
      INSERT INTO tos_anpr_table (truck_no, camera_id, snap_time, is_unlicensed, camera_ip, created_time)
      VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id
    `;
    const values = [
      truck,
      activityPoint.id,
      snap_time,
      is_unlicensed,
      cameraType,
    ];

    const results = await client.query(query, values);
    client.release();

    return { success: true, id: results.rows[0].id };
  } catch (error) {
    console.error("Error inserting data into the database:", error);
    return { success: false, error: "Error inserting data into the database" };
  }
};

const postanprActivities = async (
  truck,
  camera_id,
  snap_time,
  is_unlicensed
) => {
  try {
    const client = await pool.connect();

    const query = `
      INSERT INTO tos_anpr (truck_no, camera_id, snap_time, created_time)
      VALUES ($1, $2, $3, NOW()) RETURNING id
    `;

    const values = [truck, camera_id, snap_time];

    const result = await client.query(query, values);
    client.release();

    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error("Error inserting data into the database:", error);
    return { success: false, error: "Error inserting data into the database" };
  }
};

const updateanprActivitylog = async (id, weight) => {
  try {
    if (!(id && weight)) {
      return { success: false, message: "Activity id and weight is required" };
    }
    const client = await pool.connect();

    const query = `
      UPDATE tos_anpr_table set weight = $1 where id = $2
    `;
    const values = [weight, id];

    const results = await client.query(query, values);
    client.release();

    return { success: true };
  } catch (error) {
    console.error("Error updating weight in the database:", error);
    return { success: false, error: "Error updating weight in the database" };
  }
};

const updateanprActivities = async (id, weight) => {
  try {
    if (!(id && weight)) {
      return { success: false, message: "Activity id and weight is required" };
    }

    const client = await pool.connect();

    const query = `
      UPDATE tos_anpr set weight = $1 WHERE id = $2
    `;

    const values = [weight, id];

    const result = await client.query(query, values);
    client.release();

    return { success: true };
  } catch (error) {
    console.error("Error updating data in the database:", error);
    return { success: false, error: "Error updating data in the database" };
  }
};

module.exports = {
  postanprActivitylog,
  postanprActivities,
  updateanprActivitylog,
  updateanprActivities,
};
