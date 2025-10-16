const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");
const { v4: uuidv4 } = require("uuid"); // Import the uuid library
const { getOrCreateProductByCode } = require("./productService");

// Create a connection pool
const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

// Function to create a new delivery order
const createDeliveryOrder = async (
  truck_no,
  old_truck_no,
  trailler_no,
  customer_name,
  driver_id,
  measurement,
  product_type_id,
  packing_type_id,
  vessel,
  do_no,
  activity_check = 0,
  wheat_type_id,
  stock_transfer_code = null,
  order_type = null,
  order_items = []
) => {
  const client = await pool.connect(); // Get a database client
  try {
    await client.query("BEGIN"); // Start a transaction

    // Convert truck_no and trailler_no to uppercase if provided
    const truckNoUpperCase = truck_no ? truck_no.toUpperCase() : null;
    const traillerNoUpperCase = trailler_no ? trailler_no.toUpperCase() : null;

    let customerId = null;
    if (customer_name) {
      const checkCustomerQuery =
        "SELECT * FROM tos_customer WHERE id = $1 AND isactive = true";
      const customerResult = await client.query(checkCustomerQuery, [
        customer_name,
      ]);

      if (customerResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Customer not found or inactive" };
      }
      if (customerResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Customer not found or inactive" };
      }

      customerId = customerResult.rows[0].id;
    }

    let driverId = null;
    if (driver_id) {
      const checkDriverQuery =
        "SELECT * FROM tos_drivers WHERE id = $1 AND isactive = true";
      const driverResult = await client.query(checkDriverQuery, [driver_id]);

      if (driverResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Driver not found or inactive" };
      }

      driverId = driverResult.rows[0].id; // Set driverId if driver exists
    }

    let vesselId = null;
    if (vessel) {
      const checkVesselQuery =
        "SELECT * FROM tos_vessel WHERE id = $1 AND isactive = true";
      const vesselResult = await client.query(checkVesselQuery, [vessel]);

      if (vesselResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Vessel not found or inactive" };
      }

      vesselId = vesselResult.rows[0].id; // Set vesselId if vessel exists
    }

    let validProductId = null;
    if (product_type_id) {
      const checkProductQuery =
        "SELECT * FROM tos_product_type WHERE id = $1 AND isactive = true";
      const productResult = await client.query(checkProductQuery, [
        product_type_id,
      ]);

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Product not found or inactive" };
      }
      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Product not found or inactive" };
      }

      validProductId = productResult.rows[0].id;
    }

    let validPackingId = null;
    if (packing_type_id) {
      const checkPackingQuery =
        "SELECT * FROM tos_packing_type WHERE id = $1 AND isactive = true";
      const packingResult = await client.query(checkPackingQuery, [
        packing_type_id,
      ]);

      if (packingResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Packing not found or inactive" };
      }
      if (packingResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Packing not found or inactive" };
      }

      validPackingId = packingResult.rows[0].id;
    }

    let validWheatTypeId = null;
    if (wheat_type_id) {
      const checkWheatTypeQuery =
        "SELECT * FROM tos_wheat_type WHERE id = $1 AND status = true";
      const wheatTypeResult = await client.query(checkWheatTypeQuery, [
        wheat_type_id,
      ]);

      if (wheatTypeResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Wheat Type not found or inactive" };
      }
      if (wheatTypeResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Wheat Type not found or inactive" };
      }

      validWheatTypeId = wheatTypeResult.rows[0].id;
    }

    const insertQuery = `
      INSERT INTO tos_delivery_orders 
      (order_number, truck_no, trailler_no, customer_id, driver_id, measurement, product_type_id, packing_type_id, vessel_id, do_no, activitycheck, isactive, wheat_type_id, old_truck_no, stock_transfer_code, order_type)
      VALUES (
        CONCAT(TO_CHAR(CURRENT_DATE, 'YYYYMMDD'), LPAD(nextval('delivery_order_seq')::text, 4, '0')),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, $13, $14
      ) 
      RETURNING order_number;
    `;
    const result = await client.query(insertQuery, [
      truckNoUpperCase,
      traillerNoUpperCase,
      customerId,
      driverId, // Insert NULL if driverId is not provided
      measurement || 0, // Insert zero if measurement is not provided
      validProductId,
      validPackingId,
      vesselId,
      do_no,
      activity_check,
      validWheatTypeId,
      old_truck_no ? old_truck_no.toUpperCase().trim() : null, // Insert NULL if old_truck_no is not provided
      stock_transfer_code,
      order_type,
    ]);

    const orderNumber = result.rows[0].order_number;

    const orderQuery =
      "SELECT id FROM tos_delivery_orders WHERE order_number = $1";
    const orderDetails = await client.query(orderQuery, [orderNumber]);
    const order_id = orderDetails.rows[0].id;

    let sku = null;
    const insertFinishedOrdersQuery = `
      INSERT INTO tos_finished_orders
      (delivery_order_id, sku,product_id, packing_type_id, unit, measurement, isactive, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6,'true', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    for (const order of order_items) {
      if (typeof order.product === "string") {
        const payload = {
          name: order.product_name,
          item_code: order.product,
          isactive: true,
          product_type_id: 1,
        };
        const productId = await getOrCreateProductByCode(payload);
        console.log("P ID", productId);
        await client.query(insertFinishedOrdersQuery, [
          order_id,
          sku,
          productId,
          1,
          order.unit,
          order.quantity,
        ]);
      } else {
        await client.query(insertFinishedOrdersQuery, [
          order_id,
          sku,
          order.product,
          order.packing_type,
          order.unit,
          order.quantity,
        ]);
      }
    }

    await client.query("COMMIT"); // Commit the transaction

    return {
      success: true,
      message: "Delivery order created successfully",
      orderNumber: orderNumber,
    };
  } catch (error) {
    await client.query("ROLLBACK"); // Roll back the transaction in case of error
    console.error("Error creating delivery order:", error);
    throw new Error("Server error");
  } finally {
    client.release(); // Release the database client
  }
};

// Function to update the delivery order (only status can be updated)
const updateDeliveryOrder = async (order_number, isactive) => {
  try {
    // Check if the order exists
    const checkOrderQuery =
      "SELECT * FROM tos_delivery_orders WHERE order_number = $1";
    const orderResult = await pool.query(checkOrderQuery, [order_number]);

    if (orderResult.rows.length === 0) {
      return { success: false, message: "Order not found" };
    }

    const order = orderResult.rows[0];

    if (order.isactive === false && isactive === true) {
      return {
        success: false,
        message: "Cannot reactivate an already inactive order",
      };
    }

    // Update the status of the order
    const updateQuery = `
      UPDATE tos_delivery_orders
      SET isactive = $1
      WHERE order_number = $2
    `;
    await pool.query(updateQuery, [isactive, order_number]);

    return {
      success: true,
      message: "Delivery order status updated successfully",
    };
  } catch (error) {
    console.error("Error updating delivery order:", error);
    throw new Error("Server error");
  }
};

const createDeliveryAndFinishedOrder = async (
  order_id,
  truck_no,
  trailler_no,
  customer_name,
  driver_id, // Optional
  measurement,
  product_type_id, // Optional
  packing_type_id,
  order_items
) => {
  const client = await pool.connect(); // Get a database client
  try {
    await client.query("BEGIN"); // Start a transaction

    // Step 1: Check if the customer exists
    const checkCustomerQuery =
      "SELECT * FROM tos_customer WHERE id = $1 AND isactive = true";
    const customerResult = await client.query(checkCustomerQuery, [
      customer_name,
    ]);

    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, message: "Customer not found or inactive" };
    }

    const customerId = customerResult.rows[0].id;

    // Step 2: Check if the driver exists, if provided
    let validDriverId = null;
    if (driver_id) {
      const checkDriverQuery =
        "SELECT * FROM tos_drivers WHERE id = $1 AND isactive = true";
      const driverResult = await client.query(checkDriverQuery, [driver_id]);

      if (driverResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Driver not found or inactive" };
      }

      validDriverId = driverResult.rows[0].id; // Set validDriverId if driver exists
    }

    // Step 3: Check if the product exists, if provided
    let validProductId = null;
    if (product_type_id) {
      const checkProductQuery =
        "SELECT * FROM tos_product_type WHERE id = $1 AND isactive = true";
      const productResult = await client.query(checkProductQuery, [
        product_type_id,
      ]);

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Product not found or inactive" };
      }

      validProductId = productResult.rows[0].id;
    }

    // Step 4: Check if the packing exists
    const checkPackingQuery =
      "SELECT * FROM tos_packing_type WHERE id = $1 AND isactive = true";
    const packingResult = await client.query(checkPackingQuery, [
      packing_type_id,
    ]);

    if (packingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, message: "Packing not found or inactive" };
    }

    const validPackingId = packingResult.rows[0].id;

    // Step 5: Insert the new delivery order
    const insertDeliveryOrderQuery = `
      INSERT INTO tos_delivery_orders
      (order_number, truck_no, trailler_no, customer_id, driver_id, measurement, product_type_id, packing_type_id, isactive)
      VALUES (
        CONCAT(TO_CHAR(CURRENT_DATE, 'YYYYMMDD'), LPAD(nextval('delivery_order_seq')::text, 4, '0')),
        $1, $2, $3, $4, $5, $6, $7, true
      )
      RETURNING id;
    `;
    const deliveryOrderResult = await client.query(insertDeliveryOrderQuery, [
      truck_no,
      trailler_no,
      customerId,
      validDriverId,
      measurement,
      validProductId,
      validPackingId,
    ]);

    const deliveryOrderId = deliveryOrderResult.rows[0].id;
    let sku = null;
    // Step 6: Insert finished orders
    const insertFinishedOrdersQuery = `
      INSERT INTO tos_finished_orders
      (delivery_order_id, sku,product_id, packing_type_id, unit, measurement, isactive, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6,'true', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    for (const order of order_items) {
      if (typeof order.product === "string") {
        const payload = {
          name: order.product_name,
          item_code: order.product,
          isactive: true,
          product_type_id: 1,
        };
        const productId = await getOrCreateProductByCode(payload);
        console.log("P ID", productId);
        await client.query(insertFinishedOrdersQuery, [
          order_id,
          sku,
          productId,
          1,
          order.unit,
          order.quantity,
        ]);
      } else {
        await client.query(insertFinishedOrdersQuery, [
          order_id,
          sku,
          order.product,
          order.packing_type,
          order.unit,
          order.quantity,
        ]);
      }
    }

    await client.query("COMMIT"); // Commit the transaction

    return {
      success: true,
      message: "Delivery order and finished orders created successfully",
      delivery_order_id: deliveryOrderId,
    };
  } catch (error) {
    await client.query("ROLLBACK"); // Roll back the transaction in case of error
    console.error("Error creating delivery order and finished orders:", error);
    throw new Error("Server error");
  } finally {
    client.release(); // Release the database client
  }
};
const createDeliveryAndFinishedOrderV2 = async (
  order_id,
  truck_no,
  trailler_no,
  customer_name,
  stock_transfer_code,
  driver_id, // Optional
  measurement,
  product_type_id, // Optional
  packing_type_id,
  order_items
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let customerId = null;
    if (customer_name) {
      const checkCustomerQuery =
        "SELECT * FROM tos_customer WHERE id = $1 AND isactive = true";
      const customerResult = await client.query(checkCustomerQuery, [
        customer_name,
      ]);
      if (customerResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Customer not found or inactive" };
      }
      customerId = customerResult.rows[0].id;
    }

    let validDriverId = null;
    if (driver_id) {
      const checkDriverQuery =
        "SELECT * FROM tos_drivers WHERE id = $1 AND isactive = true";
      const driverResult = await client.query(checkDriverQuery, [driver_id]);
      if (driverResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Driver not found or inactive" };
      }
      validDriverId = driverResult.rows[0].id;
    }

    let validProductId = null;
    if (product_type_id) {
      const checkProductQuery =
        "SELECT * FROM tos_product_type WHERE id = $1 AND isactive = true";
      const productResult = await client.query(checkProductQuery, [
        product_type_id,
      ]);
      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Product not found or inactive" };
      }
      validProductId = productResult.rows[0].id;
    }

    const checkPackingQuery =
      "SELECT * FROM tos_packing_type WHERE id = $1 AND isactive = true";
    const packingResult = await client.query(checkPackingQuery, [
      packing_type_id,
    ]);
    if (packingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, message: "Packing not found or inactive" };
    }
    const validPackingId = packingResult.rows[0].id;

    // Step 5: Update the existing delivery order
    const updateDeliveryOrderQuery = `
      UPDATE tos_delivery_orders
      SET truck_no = $1,
          trailler_no = $2,
          customer_id = $3,
          driver_id = $4,
          product_type_id = $5,
          packing_type_id = $6,
          stock_transfer_code = $7
      WHERE id = $8 AND isactive = true
    `;
    await client.query(updateDeliveryOrderQuery, [
      truck_no,
      trailler_no,
      customerId,
      validDriverId,
      validProductId,
      validPackingId,
      stock_transfer_code,
      order_id,
    ]);

    // Step 6: Insert finished orders
    const insertFinishedOrdersQuery = `
      INSERT INTO tos_finished_orders
      (delivery_order_id, sku, product_id, packing_type_id, unit, measurement, isactive, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'true', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const sku = null;
    for (const order of order_items) {
      if (typeof order.product === "string") {
        //get packing type name is like product.packing_type
        const checkPackingTypeQuery =
          "SELECT * FROM tos_packing_type WHERE name ILIKE $1 AND isactive = true";
        const packingTypeResult = await client.query(checkPackingTypeQuery, [
          order.packing_type,
        ]);
        if (packingTypeResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return {
            success: false,
            message: "Packing type not found or inactive",
          };
        }
        const packingTypeId = packingTypeResult.rows[0].id;
        const payload = {
          name: order.product_name,
          item_code: order.product,
          isactive: true,
          product_type_id: 1,
        };
        const productId = await getOrCreateProductByCode(payload);
        await client.query(insertFinishedOrdersQuery, [
          order_id,
          sku,
          productId,
          packingTypeId,
          order.unit,
          order.quantity,
        ]);
      } else {
        await client.query(insertFinishedOrdersQuery, [
          order_id,
          sku,
          order.product,
          order.packing_type,
          order.unit,
          order.quantity,
        ]);
      }
    }

    await client.query("COMMIT");
    return {
      success: true,
      message:
        "Delivery order updated and finished orders created successfully",
      delivery_order_id: order_id,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      "Error updating delivery order and inserting finished orders:",
      error
    );
    throw new Error("Server error");
  } finally {
    client.release();
  }
};

// Function to retrieve all customer types with optional search functionality
const getAllDeliveryorders = async (
  search,
  order_number,
  do_no,
  truck_no,
  customer,
  created_at,
  isactive,
  limit
) => {
  try {
    // Base query to retrieve customer types
    let query = `
    select
      ord.id,
      ord.order_number,
      ord.truck_no,
      ord.trailler_no,
      ord.measurement,
      driv.name as driver,
      cust.name as customer,
      ord.isactive,ord.activitycheck,
      prodty.name as producttype,
      packty.name as packingtype,
      ord.do_no,
      ord.order_type,
      ord.created_at
    from tos_delivery_orders ord
    left join tos_drivers driv on driv.id = ord.driver_id
    left join tos_customer cust on cust.id = ord.customer_id
    left join tos_product_type prodty on prodty.id = ord.product_type_id
    left join tos_packing_type packty on packty.id = ord.packing_type_id
    WHERE ord.isactive = 'true' AND (ord.activitycheck != 2 OR ord.activitycheck IS NULL) AND ord.created_at >= NOW() - INTERVAL '48 hours'`;
    const queryParams = [];

    // Add a WHERE clause if search parameter is provided
    if (search) {
      queryParams.push(`%${search}%`);
      query += ` AND ord.truck_no ILIKE $${queryParams.length}`;
    }

    if (order_number) {
      queryParams.push(`%${order_number}%`);
      query += ` AND ord.order_number ILIKE $${queryParams.length}`;
    }

    if (do_no) {
      queryParams.push(`%${do_no}%`);
      query += ` AND ord.do_no ILIKE $${queryParams.length}`;
    }

    if (truck_no) {
      const truck_number = truck_no.replaceAll(" ", "").toUpperCase();
      queryParams.push(`%${truck_number}%`);
      query += ` AND ord.truck_no ILIKE $${queryParams.length}`;
    }

    if (customer) {
      queryParams.push(`%${customer}%`);
      query += ` AND cust.name ILIKE $${queryParams.length}`;
    }

    if (created_at) {
      queryParams.push(`${created_at}`);
      query += ` AND DATE(ord.created_at) = $${queryParams.length}`;
    }

    if (isactive !== undefined) {
      queryParams.push(isactive == "true" ? true : false);
      query += ` AND ord.isactive = $${queryParams.length}`;
    }

    // Append ORDER BY clause
    query += " ORDER BY ord.id desc ";

    if (limit) {
      queryParams.push(`${limit}`);
      query += ` LIMIT $${queryParams.length}`;
    }

    //console.log(query);

    // Execute the query with parameters
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving customer types:", error);
    throw new Error("Server error");
  }
};


module.exports = {
  createDeliveryOrder,
  updateDeliveryOrder,
  getAllDeliveryorders,
  createDeliveryAndFinishedOrder,
  createDeliveryAndFinishedOrderV2,
};
