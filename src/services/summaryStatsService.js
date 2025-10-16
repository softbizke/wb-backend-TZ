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

const getOrderTypeSummary = async (startDate, endDate) => {
  try {
    // Base query to retrieve customer types
    let query = `
        SELECT 
            CASE 
                WHEN order_type IS NOT NULL THEN order_type
                WHEN packing_type_id IS NOT NULL THEN 'raw'
                ELSE 'finished'
            END AS type,
            COUNT(*) AS count,
            SUM(measurement::numeric) AS total_measurement
        FROM tos_delivery_orders
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY type
        ORDER BY type;
    `;
    const queryParams = [startDate, endDate];

    // Execute the query with parameters
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving Order Types Summary:", error);
    throw new Error("Server error");
  }
};

const getProductsSummary = async (startDate, endDate, orderType = null) => {
  try {
    // Base query to Aggregate order quantities from two sources—finished/stock transfer/return etc orders and raw delivery orders—
    // into one combined result set for a given date range.
    let query = `
      SELECT
        result.product_id,
        SUM(result.total_measurement) AS total_measurement,
        result.name,
        result.product_type_id,
        result.item_code
      FROM (
        -------------------------------------------------------------------
        -- 1️⃣ Finished orders
        -- Join tos_finished_orders to tos_delivery_orders so we can filter
        -- on d.order_type for finished products.
        -------------------------------------------------------------------
        SELECT 
            f.product_id,
            SUM(f.measurement::numeric) AS total_measurement,
            p.name,
            p.product_type_id,
            p.item_code
        FROM tos_finished_orders f
        INNER JOIN tos_product p ON f.product_id = p.id
        INNER JOIN tos_delivery_orders d ON d.id = f.delivery_order_id   -- adjust key
        WHERE f.created_at BETWEEN $1 AND $2
          AND ($3::text IS NULL OR d.order_type = $3::text)       -- filter by order_type if provided
        GROUP BY f.product_id, p.name, p.product_type_id, p.item_code

        UNION ALL

        -------------------------------------------------------------------
        -- 2️⃣ Raw orders (still in tos_delivery_orders)
        -------------------------------------------------------------------
        SELECT
            NULL AS product_id,
            SUM(d.measurement::numeric) AS total_measurement,
            pt.name,
            pt.id AS product_type_id,
            NULL AS item_code
        FROM tos_delivery_orders d
        INNER JOIN tos_product_type pt ON d.product_type_id = pt.id
        WHERE d.order_type = 'raw'                    -- keep raw-only logic if desired
          AND d.created_at BETWEEN $1 AND $2
          AND ($3::text IS NULL OR d.order_type = $3::text)       -- same filter for consistency
        GROUP BY pt.id, pt.name
      ) AS result
      GROUP BY
        result.product_id,
        result.name,
        result.product_type_id,
        result.item_code
      ORDER BY
        result.product_id NULLS LAST;


    `;
    // let query = `
    //     SELECT
    //         f.product_id,
    //         SUM(f.measurement::numeric) AS total_measurement,
    //         p.name,
    //         p.product_type_id,
    //         p.item_code
    //     FROM tos_finished_orders f
    //     INNER JOIN tos_product p
    //         ON f.product_id = p.id
    //     WHERE f.created_at BETWEEN $1 AND $2
    //     GROUP BY f.product_id, p.name, p.product_type_id, p.item_code
    //     ORDER BY f.product_id;
    // `;
    const queryParams = [startDate, endDate, orderType || null];

    // Execute the query with parameters
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving Products Summary:", error);
    throw new Error("Server error");
  }
};

module.exports = {
  getOrderTypeSummary,
  getProductsSummary,
};
