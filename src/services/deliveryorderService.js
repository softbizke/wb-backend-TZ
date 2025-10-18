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
  order_type = null,
  order_items = [],
  transporter_id,
  buying_center_id,
  supplier_id,
  purchase_type_id,
  transaction_type,
  source,
  destination,
  packing_id,
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

    let validPackingTypeId = null;
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

      validPackingTypeId = packingResult.rows[0].id;
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

    let validTransporterId = null;
    if (transporter_id) {
      const checkTransporterQuery =
        "SELECT * FROM tos_transporter WHERE id = $1 AND isactive = true";
      const transporterResult = await client.query(checkTransporterQuery, [
        transporter_id,
      ]);

      if (transporterResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Transporter not found or inactive" };
      }
      if (transporterResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Transporter not found or inactive" };
      }

      validTransporterId = transporterResult.rows[0].id;
    }

    // ✅ Validate Buying Center
    let validBuyingCenterId = null;
    if (buying_center_id) {
      const checkBuyingCenterQuery =
        "SELECT * FROM tos_buying_center WHERE id = $1 AND isactive = true";
      const buyingCenterResult = await client.query(checkBuyingCenterQuery, [
        buying_center_id,
      ]);

      if (buyingCenterResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Buying center not found or inactive" };
      }

      validBuyingCenterId = buyingCenterResult.rows[0].id;
    }

    // ✅ Validate Supplier
    let validSupplierId = null;
    if (supplier_id) {
      const checkSupplierQuery =
        "SELECT * FROM tos_suppliers WHERE id = $1 AND isactive = true";
      const supplierResult = await client.query(checkSupplierQuery, [supplier_id]);

      if (supplierResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Supplier not found or inactive" };
      }

      validSupplierId = supplierResult.rows[0].id;
    }

    // ✅ Validate Purchase Type
    let validPurchaseTypeId = null;
    if (purchase_type_id) {
      const checkPurchaseTypeQuery =
        "SELECT * FROM tos_purchase_type WHERE id = $1";
      const purchaseTypeResult = await client.query(checkPurchaseTypeQuery, [
        purchase_type_id,
      ]);

      if (purchaseTypeResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Purchase type not found" };
      }

      validPurchaseTypeId = purchaseTypeResult.rows[0].id;
    }

    // ✅ Validate packing
    let validPackingId = null;
    if (packing_id) {
      const checkPackingQuery =
        "SELECT * FROM tos_packing WHERE id = $1";
      const packingResult = await client.query(checkPackingQuery, [
        packing_id,
      ]);

      if (packingResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Packing not found or inactive" };
      }

      validPackingId = packingResult.rows[0].id;
    }




    const insertQuery = `
      INSERT INTO tos_delivery_orders 
      (
        order_number,
        truck_no,
        trailler_no,
        customer_id,
        driver_id,
        measurement,
        product_type_id,
        packing_type_id,
        vessel_id,
        do_no,
        activitycheck,
        isactive,
        wheat_type_id,
        old_truck_no,
        order_type,
        transporter_id,
        buying_center_id,
        supplier_id,
        purchase_type_id
      )
      VALUES (
        CONCAT(TO_CHAR(CURRENT_DATE, 'YYYYMMDD'), LPAD(nextval('delivery_order_seq')::text, 4, '0')),
        $1,  -- truck_no
        $2,  -- trailler_no
        $3,  -- customer_id
        $4,  -- driver_id
        $5,  -- measurement
        $6,  -- product_type_id
        $7,  -- packing_type_id
        $8,  -- vessel_id
        $9,  -- do_no
        $10, -- activitycheck
        true,
        $11, -- wheat_type_id
        $12, -- old_truck_no
        $13, -- order_type
        $14, -- transporter_id
        $15, -- buying_center_id
        $16, -- supplier_id
        $17  -- purchase_type_id
      )
      RETURNING order_number;
    `;

    const result = await client.query(insertQuery, [
      truckNoUpperCase,
      traillerNoUpperCase,
      customerId,
      driverId || null,
      measurement || 0,
      validProductId,
      validPackingTypeId,
      vesselId,
      do_no,
      activity_check,
      validWheatTypeId,
      old_truck_no ? old_truck_no.toUpperCase().trim() : null,
      order_type,
      validTransporterId,
      validBuyingCenterId,
      validSupplierId,
      validPurchaseTypeId,
    ]);


    const orderNumber = result.rows[0].order_number;

    const orderQuery =
      "SELECT id FROM tos_delivery_orders WHERE order_number = $1";
    const orderDetails = await client.query(orderQuery, [orderNumber]);
    const order_id = orderDetails.rows[0].id;

    let sku = null;

    const insertFinishedOrdersQuery = `
      INSERT INTO tos_finished_orders
      (
        delivery_order_id,
        sku,
        product_id,
        packing_type_id,
        unit,
        measurement,
        source,
        destination,
        transaction_type,
        packing_id,
        isactive,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    for (const order of order_items) {

      if (typeof order.product === "string") {
        // Product is a string → find or create it
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
          1, // Default packing type
          order.unit,
          order.quantity,
          source,
          destination,
          transaction_type,
          packing_id,
        ]);
      } else {
        // Product is already an ID
        await client.query(insertFinishedOrdersQuery, [
          order_id,
          sku,
          order.product,
          order.packing_type,
          order.unit,
          order.quantity,
          source,
          destination,
          transaction_type,
          packing_id,
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
  truck_no,
  trailler_no,
  customer_name,
  driver_id,
  measurement,
  product_type_id,
  packing_type_id,
  transporter_id,
  buying_center_id,
  supplier_id,
  purchase_type_id,
  order_items
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ✅ Validate customer
    const customerRes = await client.query(
      "SELECT * FROM tos_customer WHERE id = $1 AND isactive = true",
      [customer_name]
    );
    if (customerRes.rows.length === 0)
      throw new Error("Customer not found or inactive");
    const customerId = customerRes.rows[0].id;

    // ✅ Validate driver
    let validDriverId = null;
    if (driver_id) {
      const driverRes = await client.query(
        "SELECT * FROM tos_drivers WHERE id = $1 AND isactive = true",
        [driver_id]
      );
      if (driverRes.rows.length === 0)
        throw new Error("Driver not found or inactive");
      validDriverId = driverRes.rows[0].id;
    }

    // ✅ Validate product type
    let validProductId = null;
    if (product_type_id) {
      const productRes = await client.query(
        "SELECT * FROM tos_product_type WHERE id = $1 AND isactive = true",
        [product_type_id]
      );
      if (productRes.rows.length === 0)
        throw new Error("Product not found or inactive");
      validProductId = productRes.rows[0].id;
    }

    // ✅ Validate packing type
    const packRes = await client.query(
      "SELECT * FROM tos_packing_type WHERE id = $1 AND isactive = true",
      [packing_type_id]
    );
    if (packRes.rows.length === 0)
      throw new Error("Packing type not found or inactive");
    const validPackingId = packRes.rows[0].id;

    // ✅ Validate linked entities
    const validateActive = async (table, id, name) => {
      if (!id) return null;
      const res = await client.query(`SELECT * FROM ${table} WHERE id = $1 AND isactive = true`, [id]);
      if (res.rows.length === 0) throw new Error(`${name} not found or inactive`);
      return res.rows[0].id;
    };

    const validTransporterId = await validateActive("tos_transporter", transporter_id, "Transporter");
    const validBuyingCenterId = await validateActive("tos_buying_center", buying_center_id, "Buying center");
    const validSupplierId = await validateActive("tos_supplier", supplier_id, "Supplier");
    const validPurchaseTypeId = await validateActive("tos_purchase_type", purchase_type_id, "Purchase type");

    // ✅ Insert new delivery order
    const insertDeliveryOrderQuery = `
      INSERT INTO tos_delivery_orders
      (order_number, truck_no, trailler_no, customer_id, driver_id, measurement, product_type_id, packing_type_id, transporter_id, buying_center_id, supplier_id, purchase_type_id, isactive)
      VALUES (
        CONCAT(TO_CHAR(CURRENT_DATE, 'YYYYMMDD'), LPAD(nextval('delivery_order_seq')::text, 4, '0')),
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true
      )
      RETURNING id;
    `;
    const deliveryRes = await client.query(insertDeliveryOrderQuery, [
      truck_no,
      trailler_no,
      customerId,
      validDriverId,
      measurement,
      validProductId,
      validPackingId,
      validTransporterId,
      validBuyingCenterId,
      validSupplierId,
      validPurchaseTypeId,
    ]);

    const deliveryOrderId = deliveryRes.rows[0].id;
    let sku = null;

    // ✅ Insert finished orders
    const insertFinishedOrdersQuery = `
      INSERT INTO tos_finished_orders
      (delivery_order_id, sku, product_id, packing_type_id, unit, measurement, source, destination, transaction_type, isactive, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `;

    for (const order of order_items) {
      const sourceVal = order.source || null;
      const destinationVal = order.destination || null;
      const transactionTypeVal = order.transaction_type || null;

      if (typeof order.product === "string") {
        const payload = {
          name: order.product_name,
          item_code: order.product,
          isactive: true,
          product_type_id: 1,
        };
        const productId = await getOrCreateProductByCode(payload);
        await client.query(insertFinishedOrdersQuery, [
          deliveryOrderId,
          sku,
          productId,
          1,
          order.unit,
          order.quantity,
          sourceVal,
          destinationVal,
          transactionTypeVal,
        ]);
      } else {
        await client.query(insertFinishedOrdersQuery, [
          deliveryOrderId,
          sku,
          order.product,
          order.packing_type,
          order.unit,
          order.quantity,
          sourceVal,
          destinationVal,
          transactionTypeVal,
        ]);
      }
    }

    await client.query("COMMIT");
    return {
      success: true,
      message: "Delivery order and finished orders created successfully",
      delivery_order_id: deliveryOrderId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating delivery order and finished orders:", error);
    return { success: false, message: error.message };
  } finally {
    client.release();
  }
};



const createDeliveryAndFinishedOrderV2 = async (
  order_id,
  truck_no,
  trailler_no,
  customer_name,
  driver_id,
  measurement,
  product_type_id,
  packing_type_id,
  transporter_id,
  buying_center_id,
  supplier_id,
  purchase_type_id,
  order_items
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ✅ Validate customer
    const checkCustomerQuery =
      "SELECT * FROM tos_customer WHERE id = $1 AND isactive = true";
    const customerResult = await client.query(checkCustomerQuery, [customer_name]);
    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, message: "Customer not found or inactive" };
    }
    const customerId = customerResult.rows[0].id;

    // ✅ Validate driver
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

    // ✅ Validate product
    let validProductId = null;
    if (product_type_id) {
      const checkProductQuery =
        "SELECT * FROM tos_product_type WHERE id = $1 AND isactive = true";
      const productResult = await client.query(checkProductQuery, [product_type_id]);
      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Product not found or inactive" };
      }
      validProductId = productResult.rows[0].id;
    }

    // ✅ Validate packing type
    const checkPackingQuery =
      "SELECT * FROM tos_packing_type WHERE id = $1 AND isactive = true";
    const packingResult = await client.query(checkPackingQuery, [packing_type_id]);
    if (packingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, message: "Packing not found or inactive" };
    }
    const validPackingId = packingResult.rows[0].id;

    // ✅ Validate transporter, buying center, supplier, and purchase type
    const validateActive = async (table, id, fieldName) => {
      if (!id) return null;
      const res = await client.query(`SELECT * FROM ${table} WHERE id = $1 AND isactive = true`, [id]);
      if (res.rows.length === 0) {
        await client.query("ROLLBACK");
        throw new Error(`${fieldName} not found or inactive`);
      }
      return res.rows[0].id;
    };

    const validTransporterId = await validateActive("tos_transporter", transporter_id, "Transporter");
    const validBuyingCenterId = await validateActive("tos_buying_center", buying_center_id, "Buying center");
    const validSupplierId = await validateActive("tos_suppliers", supplier_id, "Supplier");
    const validPurchaseTypeId = await validateActive("tos_purchase_type", purchase_type_id, "Purchase type");

    // ✅ Update the existing delivery order
    const updateDeliveryOrderQuery = `
      UPDATE tos_delivery_orders
      SET truck_no = $1,
          trailler_no = $2,
          customer_id = $3,
          driver_id = $4,
          product_type_id = $5,
          packing_type_id = $6,
          transporter_id = $7,
          buying_center_id = $8,
          supplier_id = $9,
          purchase_type_id = $10
      WHERE id = $11 AND isactive = true
    `;
    await client.query(updateDeliveryOrderQuery, [
      truck_no,
      trailler_no,
      customerId,
      validDriverId,
      validProductId,
      validPackingId,
      validTransporterId,
      validBuyingCenterId,
      validSupplierId,
      validPurchaseTypeId,
      order_id,
    ]);

    // ✅ Insert finished orders
    const insertFinishedOrdersQuery = `
      INSERT INTO tos_finished_orders
      (delivery_order_id, sku, product_id, packing_type_id, unit, measurement, source, destination, transaction_type, isactive, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const sku = null;
    for (const order of order_items) {
      const sourceVal = order.source || null;
      const destinationVal = order.destination || null;
      const transactionTypeVal = order.transaction_type || null;

      if (typeof order.product === "string") {
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
          1,
          order.unit,
          order.quantity,
          sourceVal,
          destinationVal,
          transactionTypeVal,
        ]);
      } else {
        await client.query(insertFinishedOrdersQuery, [
          order_id,
          sku,
          order.product,
          order.packing_type,
          order.unit,
          order.quantity,
          sourceVal,
          destinationVal,
          transactionTypeVal,
        ]);
      }
    }

    await client.query("COMMIT");
    return {
      success: true,
      message: "Delivery order updated and finished orders created successfully",
      delivery_order_id: order_id,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating delivery order and inserting finished orders:", error);
    return { success: false, message: error.message };
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
        ord.*,
        driv.name AS driver,
        cust.name AS customer,
        supp.name AS supplier_name,
        trans.title AS transporter_title,
        buyc.title AS buying_center_title,
        prodty.name AS producttype,
        packty.name AS packingtype,
        purchtype.title AS purchase_type_title,

        jsonb_build_object(
          'id', driv.id,
          'name', driv.name,
          'phone_number', driv.license_no
        ) AS driver_info,

        jsonb_build_object(
          'id', cust.id,
          'name', cust.name,
          'bp_code', cust.bp_code
        ) AS customer_info,

        jsonb_build_object(
          'id', supp.id,
          'name', supp.name,
          'phone_number', supp.phone_number
        ) AS supplier,

        jsonb_build_object(
          'id', trans.id,
          'title', trans.title
        ) AS transporter,

        jsonb_build_object(
          'id', buyc.id,
          'title', buyc.title
        ) AS buying_center,

        jsonb_build_object(
          'id', purchtype.id,
          'title', purchtype.title
        ) AS purchase_type,

        jsonb_build_object(
          'id', prodty.id,
          'name', prodty.name
        ) AS product_type,

        jsonb_build_object(
          'id', packty.id,
          'name', packty.name
        ) AS packing_type

      FROM tos_delivery_orders ord
      LEFT JOIN tos_drivers driv ON driv.id = ord.driver_id
      LEFT JOIN tos_customer cust ON cust.id = ord.customer_id
      LEFT JOIN tos_suppliers supp ON supp.id = ord.supplier_id
      LEFT JOIN tos_transporter trans ON trans.id = ord.transporter_id
      LEFT JOIN tos_buying_center buyc ON buyc.id = ord.buying_center_id
      LEFT JOIN tos_purchase_type purchtype ON purchtype.id = ord.purchase_type_id
      LEFT JOIN tos_product_type prodty ON prodty.id = ord.product_type_id
      LEFT JOIN tos_packing_type packty ON packty.id = ord.packing_type_id

      WHERE ord.isactive = TRUE
        AND (ord.activitycheck != 2 OR ord.activitycheck IS NULL)
        AND ord.created_at >= NOW() - INTERVAL '48 hours'
      
    `;
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
    query += " ORDER BY ord.created_at desc ";

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
