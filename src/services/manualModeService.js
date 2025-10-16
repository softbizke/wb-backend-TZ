const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");

const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

// Request manual mode
const requestManualMode = async (user_id, reason) => {
  try {
    // Check for existing active session
    const checkQuery = `
      SELECT id FROM tos_manual_mode 
      WHERE user_id = $1 AND status IN ('pending', 'approved')
      LIMIT 1
    `;
    const existing = await pool.query(checkQuery, [user_id]);

    if (existing.rows.length > 0) {
      return {
        status: false,
        message: "You already have an active or pending manual mode request.",
      };
    }

    // Proceed with request
    const insertQuery = `
      INSERT INTO tos_manual_mode (user_id, status, reason, created_at, updated_at)
      VALUES ($1, 'pending', $2, NOW(), NOW())
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [user_id, reason]);

    return {
      status: true,
      message: "Manual mode request submitted.",
      data: result.rows[0],
    };
  } catch (error) {
    console.error("requestManualMode error:", error);
    return { status: false, message: "Server error during request." };
  }
};

// Approve request
const approveManualMode = async (id, expires_at) => {
  try {
    const query = `
      UPDATE tos_manual_mode
      SET status = 'approved', expires_at = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id, expires_at]);

    if (result.rows.length === 0) {
      return { status: false, message: "Request not found." };
    }

    return {
      status: true,
      message: "Manual mode approved.",
      data: result.rows[0],
    };
  } catch (error) {
    console.error("approveManualMode error:", error);
    return { status: false, message: "Error approving manual mode." };
  }
};

// Reject request
const rejectManualMode = async (id, reason = null) => {
try {
    const query = `
      UPDATE tos_manual_mode
      SET status = 'rejected', reason = COALESCE($2, reason), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id, reason]);

    if (result.rows.length === 0) {
      return { status: false, message: "Request not found." };
    }

    return {
      status: true,
      message: "Manual mode rejected.",
      data: result.rows[0],
    };
  } catch (error) {
    console.error("rejectManualMode error:", error);
    return { status: false, message: "Error rejecting manual mode." };
  }
};

// List all manual mode requests (admin)
const getAllManualModeRequests = async () => {
  try {
    const result = await pool.query(
      `
      SELECT 
        m.id AS request_id,
        m.reason,
        m.status,
        m.created_at,
        m.updated_at,
        m.expires_at,
        u.id AS user_id,
        u.phone,
        u.first_name,
        u.last_name
      FROM 
        tos_manual_mode m
      JOIN 
        tos_users u ON m.user_id = u.id
      ORDER BY 
        m.created_at DESC
      `
    );

    return {
      status: true,
      message: "Requests fetched successfully.",
      data: result.rows,
    };
  } catch (error) {
    console.error("getAllManualModeRequests error:", error);
    return { status: false, message: "Error fetching requests." };
  }
};

// Check if user is in manual mode
const isUserInManualMode = async (user_id) => {
  try {
    const query = `
      SELECT * FROM tos_manual_mode
      WHERE user_id = $1
        AND status = 'approved'
        AND expires_at > NOW()
      LIMIT 1
    `;
    const result = await pool.query(query, [user_id]);

    if (result.rows.length > 0) {
      return {
        status: true,
        message: "User is in manual mode.",
        data: result.rows[0],
      };
    } else {
      return {
        status: false,
        message: "User is not in manual mode.",
      };
    }
  } catch (error) {
    console.error("isUserInManualMode error:", error);
    return { status: false, message: "Error checking manual mode status." };
  }
};

/**
 * Manually log vehicle plate activity during manual mode.
 * @param {string} truck - Plate number.
 * @param {string} camera_id - Human-friendly name like "ENTRY_CAM_1".
 * @param {string} snap_time - Optional time string in ISO format or null.
 */
const postManualModeLog = async (truck, camera_id) => {
  try {
    const checkActivityPointQuery = `
      SELECT id, name, isactive FROM tos_activity_points WHERE id = $1
    `;
    const activityPointResult = await pool.query(checkActivityPointQuery, [
      camera_id,
    ]);

    if (activityPointResult.rows.length === 0) {
      return { status: false, message: "Activity type not found" };
    }

    const activityPoint = activityPointResult.rows[0];
    if (!activityPoint.isactive) {
      return { status: false, message: "Activity type is inactive" };
    }

    const insertQuery = `
      INSERT INTO tos_anpr_table (truck_no, camera_id, snap_time, mode)
      VALUES ($1, $2, NOW(), 'manual')
    `;
    const values = [truck, activityPoint.id];

    await pool.query(insertQuery, values);

    return {
      status: true,
      message: "Manual mode activity logged successfully.",
    };
  } catch (error) {
    console.error("postManualModeLog error:", error);
    return {
      status: false,
      message: "Database error during manual mode logging.",
    };
  }
};

//extend manualmode
const extendManualMode = async (id, new_expiry) => {
  try {
    const query = `
      UPDATE tos_manual_mode
      SET expires_at = $2, updated_at = NOW()
      WHERE id = $1 AND status = 'approved'
      RETURNING *
    `;
    const result = await pool.query(query, [id, new_expiry]);

    if (result.rows.length === 0) {
      return {
        status: false,
        message: "Approved request not found or invalid.",
      };
    }

    return {
      status: true,
      message: "Manual mode extended.",
      data: result.rows[0],
    };
  } catch (error) {
    console.error("extendManualMode error:", error);
    return { status: false, message: "Error extending manual mode." };
  }
};
const endManualModeSession = async (id) => {
  try {
    const query = `
      UPDATE tos_manual_mode
      SET status = 'ended', expires_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return { status: false, message: "Manual mode session not found." };
    }

    return {
      status: true,
      message: "Manual mode session ended successfully.",
      data: result.rows[0],
    };
  } catch (error) {
    console.error("endManualModeSession error:", error);
    return {
      status: false,
      message: "Error ending manual mode session.",
    };
  }
};
module.exports = {
  requestManualMode,
  approveManualMode,
  rejectManualMode,
  getAllManualModeRequests,
  isUserInManualMode,
  postManualModeLog,
  extendManualMode,
  endManualModeSession,
};
