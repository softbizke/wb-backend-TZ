const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");
const deliveryOrderService = require("./deliveryorderService");
const { autoPrintReceipt } = require("../controllers/pdfController");

// Create a connection pool
const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

const createOrUpdateActivityType = async (name, type, isactive) => {
  try {
    const checkActivityTypeQuery =
      "SELECT * FROM tos_activity_type WHERE name = $1";
    const activityTypeResult = await pool.query(checkActivityTypeQuery, [name]);

    if (activityTypeResult.rows.length === 0) {
      const insertQuery = `
          INSERT INTO tos_activity_type (name, type, isactive)
          VALUES ($1, $2, $3)
        `;
      await pool.query(insertQuery, [name, type, isactive]);

      return { success: true, message: "Activity type created successfully" };
    } else {
      const updateQuery = `
          UPDATE tos_activity_type
          SET isactive = $1
          WHERE name = $2
        `;
      await pool.query(updateQuery, [isactive, name]);

      return { success: true, message: "Activity type updated successfully" };
    }
  } catch (error) {
    console.error("Error creating or updating activity type:", error);
    throw new Error("Server error");
  }
};

const getAllCameras = async () => {
  try {
    const query = `
      SELECT 
        c.id, 
        c.model, 
        c.ip_address, 
        c.rtsp_url, 
        c.status, 
        c.configuration,
        EXISTS (
          SELECT 1
          FROM tos_activity_points point
          WHERE c.id = ANY(point.camera_ids)
        ) AS is_linked
      FROM tos_camera_information c
      ORDER BY c.model ASC;

    `;
    // const query = `
    //   SELECT id, model, ip_address, rtsp_url, status, configuration
    //   FROM tos_camera_information
    //   WHERE status = 'active'
    //   ORDER BY model ASC
    // `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving cameras:", error);
    throw new Error("Server error");
  }
};

const createOrUpdateCamera = async (cameraData) => {
  try {
    const {
      model,
      ip_address,
      rtsp_url,
      status,
      configuration,
      username,
      password,
    } = cameraData;

    const checkCameraQuery =
      "SELECT * FROM tos_camera_information WHERE ip_address = $1";
    const cameraResult = await pool.query(checkCameraQuery, [ip_address]);

    if (cameraResult.rows.length === 0) {
      const insertQuery = `
        INSERT INTO tos_camera_information 
        (model, ip_address, rtsp_url, status, configuration, username, password)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      const result = await pool.query(insertQuery, [
        model,
        ip_address,
        rtsp_url,
        status,
        configuration,
        username,
        password,
      ]);
      return {
        success: true,
        message: "Camera created successfully",
        id: result.rows[0].id,
      };
    } else {
      const updateQuery = `
        UPDATE tos_camera_information
        SET model = $1, rtsp_url = $2, status = $3, configuration = $4, username = $5, password = $6
        WHERE ip_address = $7
        RETURNING id
      `;
      const result = await pool.query(updateQuery, [
        model,
        rtsp_url,
        status,
        configuration,
        username,
        password,
        ip_address,
      ]);
      return {
        success: true,
        message: "Camera updated successfully",
        id: result.rows[0].id,
      };
    }
  } catch (error) {
    console.error("Error managing camera:", error);
    throw new Error("Server error");
  }
};

const createOrUpdateActivityPoint = async (
  name,
  address,
  isactive,
  camera_ids
) => {
  try {
    const checkActivityPointQuery =
      "SELECT * FROM tos_activity_points WHERE name = $1";
    const activityPointResult = await pool.query(checkActivityPointQuery, [
      name,
    ]);

    if (activityPointResult.rows.length === 0) {
      const insertQuery = `
        INSERT INTO tos_activity_points (name, address, isactive, camera_ids)
        VALUES ($1, $2, $3, $4)
      `;
      await pool.query(insertQuery, [name, address, isactive, camera_ids]);
      return { success: true, message: "Activity point created successfully" };
    } else {
      const updateQuery = `
        UPDATE tos_activity_points
        SET isactive = $1, address = $2, camera_ids = $3
        WHERE name = $4
      `;
      await pool.query(updateQuery, [isactive, address, camera_ids, name]);
      return { success: true, message: "Activity point updated successfully" };
    }
  } catch (error) {
    console.error("Error creating or updating activity point:", error);
    throw new Error("Server error");
  }
};

const createOrUpdateActivity = async (
  delivery_order_number,
  weightwb2,
  weightwb1,
  snapshots,
  weighbridge_details,
  truck_no,
  trailler_no,
  customer_id,
  driver_id,
  product_type_id,
  packing_type_id,
  vessel_id,
  do_no
) => {
  let activity_type_name;
  let qty;

  try {
    const checkActivityTypeQuery = `
      SELECT type, isactive FROM tos_activity_type WHERE name = $1
    `;

    if (!delivery_order_number && weightwb1) {
      let activity_check = 1;
      const orderResult = await deliveryOrderService.createDeliveryOrder(
        truck_no,
        trailler_no,
        customer_id,
        driver_id,
        weightwb1,
        product_type_id,
        packing_type_id,
        vessel_id,
        do_no,
        activity_check
      );

      if (!orderResult.success) {
        return { success: false, message: orderResult.message };
      }

      const orderQuery =
        "SELECT id FROM tos_delivery_orders WHERE order_number = $1";
      const orderDetails = await pool.query(orderQuery, [
        orderResult.orderNumber,
      ]);
      const orderId = orderDetails.rows[0].id;
      const orderNumber = orderResult.orderNumber;

      activity_type_name = "WBIN";
      const activityTypeResult = await pool.query(checkActivityTypeQuery, [
        activity_type_name,
      ]);
      if (activityTypeResult.rows.length === 0) {
        return { success: false, message: "Activity type not found" };
      }

      const activityType = activityTypeResult.rows[0];
      if (!activityType.isactive) {
        return { success: false, message: "Activity type is inactive" };
      }
      //already inserting weight here
      const insertActivityQuery = `
        INSERT INTO tos_activities 
        (delivery_order_id, activity_type, truck_no, trailler_no, tare_weight, isactive, images, weighbridge_details) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

      await pool.query(insertActivityQuery, [
        orderId,
        activityType.type,
        truck_no,
        trailler_no,
        weightwb1,
        true,
        snapshots,
        weighbridge_details,
      ]);

      return {
        success: true,
        message: "First weight recorded successfully",
        data: {
          activitycheck: 1,
          order_number: orderNumber,
        },
      };
    }

    const checkOrderQuery = `
      SELECT id, isactive, truck_no, trailler_no, activitycheck
      FROM tos_delivery_orders 
      WHERE id = $1
    `;
    const orderResult = await pool.query(checkOrderQuery, [
      delivery_order_number,
    ]);

    if (orderResult.rows.length === 0) {
      return { success: false, message: "Delivery order not found" };
    }

    const order = orderResult.rows[0];
    if (!order.isactive) {
      return { success: false, message: "Delivery order is inactive" };
    }

    if (order.activitycheck == 0) {
      qty = weightwb1;
      activity_type_name = "WBIN";
    } else if (order.activitycheck == 1) {
      qty = weightwb2;
      activity_type_name = "WBOUT";
    }

    const activityTypeResult = await pool.query(checkActivityTypeQuery, [
      activity_type_name,
    ]);
    if (activityTypeResult.rows.length === 0) {
      return { success: false, message: "Activity type not found" };
    }

    const activityType = activityTypeResult.rows[0];
    if (!activityType.isactive) {
      return { success: false, message: "Activity type is inactive" };
    }

    if (activity_type_name === "WBIN" && qty <= 0) {
      return {
        success: false,
        message: "First weight cannot be zero or less than zero",
      };
    }
    if (activity_type_name === "WBOUT" && qty <= 0) {
      return {
        success: false,
        message: "Second weight cannot be zero or less than zero",
      };
    }

    const checkExistingActivityQuery = `
      SELECT id FROM tos_activities 
      WHERE delivery_order_id = $1 AND activity_type = $2 AND isactive = true
    `;
    const existingActivityResult = await pool.query(
      checkExistingActivityQuery,
      [order.id, activityType.type]
    );

    if (existingActivityResult.rows.length > 0) {
      return {
        success: false,
        message:
          "This activity type has already been performed for this delivery order",
      };
    }

    let activityValues = {
      tare_weight: null,
      gross_weight: null,
      qty: null,
      isactive: true,
      activitycheck: activity_type_name === "WBIN" ? 1 : 2,
    };

    if (activity_type_name === "WBIN") {
      activityValues.tare_weight = qty;
    } else {
      activityValues.gross_weight = qty;

      const getTareWeightQuery = `
        SELECT tare_weight 
        FROM tos_activities 
        WHERE delivery_order_id = $1 AND activity_type = 10 AND isactive = true
      `;
      const tareWeightResult = await pool.query(getTareWeightQuery, [order.id]);

      if (
        tareWeightResult.rows.length === 0 ||
        tareWeightResult.rows[0].tare_weight === null
      ) {
        return {
          success: false,
          message: "No valid tare weight found for this delivery order",
        };
      }

      activityValues.qty = Math.abs(qty - tareWeightResult.rows[0].tare_weight);

      await pool.query(
        `
        UPDATE tos_activities 
        SET isactive = false 
        WHERE delivery_order_id = $1 AND activity_type = 10 AND isactive = true
      `,
        [order.id]
      );
    }
    //log order id
    console.log("Order ID:", order.id);
    console.log("Activity Type:", activityType.type);
    console.log("Activity Values:", activityValues);
    //update record instead of inserting
    const updateActivityQuery = `
      UPDATE tos_activities
      SET gross_weight = $1, tare_weight = $2, qty = $3, isactive = $4, images = $5, weighbridge_details = $6
      WHERE delivery_order_id = $7
    `;
    const updateResult = await pool.query(updateActivityQuery, [
      activityValues.gross_weight,
      activityValues.tare_weight,
      activityValues.qty,
      activityValues.isactive,
      snapshots,
      weighbridge_details,
      order.id,
    ]);
    console.log("Update Result:", updateResult);
    if (updateResult.rowCount === 0) {
      // If no rows were updated, insert a new record
      const insertActivityQuery = `
        INSERT INTO tos_activities 
        (delivery_order_id, activity_type, truck_no, trailler_no, tare_weight, gross_weight, qty, isactive, images, weighbridge_details) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      await pool.query(insertActivityQuery, [
        order.id,
        activityType.type,
        order.truck_no,
        order.trailler_no,
        activityValues.tare_weight,
        activityValues.gross_weight,
        activityValues.qty,
        activityValues.isactive,
        snapshots,
        weighbridge_details,
      ]);
    }

    await pool.query(
      `
      UPDATE tos_delivery_orders 
      SET activitycheck = $1 
      WHERE id = $2
    `,
      [activityValues.activitycheck, order.id]
    );

    return {
      success: true,
      message: "Activity record created successfully",
      data: { activitycheck: activityValues.activitycheck },
    };
  } catch (error) {
    console.error("Error creating activity:", error);
    throw new Error("Server error");
  }
};

const createOrUpdateActivityV2 = async (data, user) => {
  console.log("DATA IN ACTIVITY V2", data);
  let {
    activity_id,
    delivery_order_number,
    weightwb2,
    weightwb1,
    snapshots,
    weighbridge_details,
    truck_no,
    old_truck_no,
    trailler_no,
    customer_id,
    stock_transfer_code,
    driver_id,
    product_type_id,
    packing_type_id,
    vessel_id,
    do_no,
    activity_type,
    wheat_type_id,
    print,
    avrg_weight,
    status,
    order_type,
    order_items,
  } = data;
  let activity_type_name;
  let qty;

  try {
    const checkActivityTypeQuery = `
      SELECT type, isactive FROM tos_activity_type WHERE name = $1
    `;

    // Handle first weight (WBIN) without a delivery order
    if (!delivery_order_number && weightwb1) {
      let activity_check = 1;

      // Create a new delivery order
      const orderResult = await deliveryOrderService.createDeliveryOrder(
        truck_no,
        old_truck_no,
        trailler_no,
        customer_id,
        driver_id,
        weightwb1,
        product_type_id,
        packing_type_id,
        vessel_id,
        do_no,
        activity_check,
        wheat_type_id,
        stock_transfer_code,
        order_type,
        order_items
      );

      if (!orderResult.success) {
        return { success: false, message: orderResult.message };
      }

      const orderQuery =
        "SELECT id FROM tos_delivery_orders WHERE order_number = $1";
      const orderDetails = await pool.query(orderQuery, [
        orderResult.orderNumber,
      ]);
      const orderId = orderDetails.rows[0].id;
      const orderNumber = orderResult.orderNumber;

      activity_type_name = "WBIN";
      const activityTypeResult = await pool.query(checkActivityTypeQuery, [
        activity_type_name,
      ]);
      if (activityTypeResult.rows.length === 0) {
        return { success: false, message: "Activity type not found" };
      }

      const activityType = activityTypeResult.rows[0];
      if (!activityType.isactive) {
        return { success: false, message: "Activity type is inactive" };
      }

      // Insert the WBIN activity
      const insertActivityQuery = `
        INSERT INTO tos_activities 
        (delivery_order_id, activity_type, truck_no, trailler_no, tare_weight, isactive, images, weighbridge_details,fw_at,fw_by,fw_wb, avrg_w) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11)
        RETURNING id
      `;
      await pool.query(insertActivityQuery, [
        orderId,
        activityType.type,
        truck_no,
        trailler_no,
        weightwb1,
        true,
        snapshots,
        weighbridge_details,
        user.id, // fw_by
        weighbridge_details.first_weight.weighbridge_id,
        avrg_weight,
      ]);

      return {
        success: true,
        message: "First weight recorded successfully",
        data: {
          activitycheck: 1,
          order_number: orderNumber,
        },
      };
    }

    if (typeof delivery_order_number === "number") {
      checkOrderQuery = `
        SELECT id, isactive, truck_no, trailler_no, activitycheck
        FROM tos_delivery_orders 
        WHERE id = $1
      `;
    } else if (typeof delivery_order_number === "string") {
      checkOrderQuery = `
        SELECT id, isactive, truck_no, trailler_no, activitycheck
        FROM tos_delivery_orders 
        WHERE order_number = $1
      `;
    } else {
      throw new Error("Invalid delivery_order_number type");
    }
    const orderResult = await pool.query(checkOrderQuery, [
      delivery_order_number,
    ]);

    if (orderResult.rows.length === 0) {
      return { success: false, message: "Delivery order not found" };
    }

    const order = orderResult.rows[0];
    if (!order.isactive) {
      return { success: false, message: "Delivery order is inactive" };
    }
    // Determine activity type and quantity
    if (order.activitycheck == 0) {
      qty = weightwb1;
      activity_type_name = activity_type;
    } else if (order.activitycheck == 1) {
      qty = weightwb2;
      activity_type_name = activity_type;
    }

    const activityTypeResult = await pool.query(checkActivityTypeQuery, [
      activity_type_name,
    ]);
    if (activityTypeResult.rows.length === 0) {
      return { success: false, message: "Activity type not found" };
    }

    const activityType = activityTypeResult.rows[0];
    if (!activityType.isactive) {
      return { success: false, message: "Activity type is inactive" };
    }

    if (qty <= 0) {
      return {
        success: false,
        message: `${
          activity_type_name === "WBIN" ? "First" : "Second"
        } weight cannot be zero or less than zero`,
      };
    }

    // Check for an existing activity
    const checkExistingActivityQuery = `
      SELECT id FROM tos_activities 
      WHERE id = $1 AND isactive = true
    `;
    console.log("ACTv  ID ", activity_id);
    const existingActivityResult = await pool.query(
      checkExistingActivityQuery,
      [activity_id]
    );
    console.log("ACTIVITY ", existingActivityResult.rows);
    if (existingActivityResult.rows.length > 0) {
      const existingActivityId = existingActivityResult.rows[0].id;
      let isActive = Boolean(status);
      console.log("ACTIVE", isActive, "STATUS", status);
      // if (avrg_weight === 0 && quantity && activity_type_name === "WBOUT") {
      //   const net = Math.abs(qty - (await getTareWeight(existingActivityId)));
      //   avrg_weight= net/
      // }
      // Update the existing activity
      const updateActivityQuery = `
        UPDATE tos_activities
        SET gross_weight = $1, qty = $2, images = $3, weighbridge_details = $4, sw_by=$5, sw_wb=$6, avrg_w=$7, isactive = $8, sw_at = NOW(), sw_truck_no = $9
        WHERE id = $10
      `;
      await pool.query(updateActivityQuery, [
        activity_type_name === "WBOUT" ? qty : null,
        activity_type_name === "WBOUT"
          ? Math.abs(qty - (await getTareWeight(existingActivityId)))
          : null,
        snapshots,
        weighbridge_details,
        user.id, // sw_by
        weighbridge_details.second_weight.weighbridge_id,
        avrg_weight,
        isActive,
        truck_no || order.truck_no, // Use provided truck_no or existing one
        existingActivityId,
      ]);

      // Update the delivery order's activitycheck
      const activityCheck = activity_type_name === "WBIN" ? 1 : 2;
      const measurement = Math.abs(
        qty - (await getTareWeight(existingActivityId))
      );

      // Update the delivery order's activitycheck and measurement

      const fields = {
        activitycheck: activityCheck,
        measurement,
        isactive: isActive,
        customer_id,
        driver_id,
        product_type_id,
        packing_type_id,
        vessel_id,
        do_no,
        wheat_type_id,
        stock_transfer_code,
        order_type,
      };

      const setClauses = [];
      const values = [];
      let idx = 1;

      for (const [key, value] of Object.entries(fields)) {
        if (value !== null && value !== undefined) {
          setClauses.push(`${key} = $${idx}`);
          values.push(value);
          idx++;
        }
      }

      // Add the id (used in WHERE clause)
      values.push(order.id);
      const idParamIndex = values.length;

      const query = `
        UPDATE tos_delivery_orders
        SET ${setClauses.join(", ")}
        WHERE id = $${idParamIndex}
        RETURNING order_number
      `;

      const tos_del = await pool.query(query, values);

      // const tos_del = await pool.query(
      //   `
      //   UPDATE tos_delivery_orders
      //   SET activitycheck = $1,
      //       measurement = $2,
      //       isactive = $3,
      //       customer_id = $5,
      //       driver_id = $6,
      //       product_type_id = $7,
      //       packing_type_id = $8,
      //       vessel_id = $9,
      //       do_no = $10,
      //       wheat_type_id = $11,
      //       stock_transfer_code= $12,
      //       order_type = $13

      //   WHERE id = $4
      //   RETURNING order_number
      // `,
      //   [
      //     activityCheck,
      //     measurement,
      //     isActive,
      //     order.id,
      //     customer_id,
      //     driver_id,
      //     product_type_id,
      //     packing_type_id,
      //     vessel_id,
      //     do_no,
      //     wheat_type_id,
      //     stock_transfer_code,
      //     order_type,
      //   ]
      // );
      const orderNumber = tos_del.rows[0].order_number;
      console.log("ORDER NUMBER", orderNumber);

      return {
        success: true,
        message: "Activity updated successfully",
        order_number: orderNumber,
      };
    } else {
      // Insert a new activity if no existing activity is found

      console.log("Order", order);
      const insertActivityQuery = `
      INSERT INTO tos_activities 
      (delivery_order_id, activity_type, truck_no, trailler_no, tare_weight, gross_weight, qty, isactive, images, weighbridge_details, fw_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,NOW())
    `;
      await pool.query(insertActivityQuery, [
        order.id,
        activityType.type,
        order.truck_no,
        order.trailler_no,
        activity_type_name === "WBIN" ? qty : null,
        activity_type_name === "WBOUT" ? qty : null,
        activity_type_name === "WBOUT"
          ? Math.abs(qty - (await getTareWeight(order.id)))
          : qty,
        true,
        snapshots,
        weighbridge_details,
      ]);

      // Update the delivery order's activitycheck
      const tos_del = await pool.query(
        `
        UPDATE tos_delivery_orders 
        SET activitycheck = $1 
        WHERE id = $2
        RETURNING order_number
      `,
        [activity_type_name === "WBIN" ? 1 : 2, order.id]
      );

      //get order number from tos_delivery_orders
      const orderNumber = tos_del.rows[0].order_number;
      // print receipt
      // if (print) {
      //   await autoPrintReceipt(orderNumber, res, req.user);
      // }
      return {
        success: true,
        message: "Activity record created successfully",
        order_number: orderNumber,
      };
    }
  } catch (error) {
    console.error("Error in createOrUpdateActivityV2:", error);
    throw new Error("Server error");
  }
};

// Helper function to get tare weight AND isactive = true
const getTareWeight = async (id) => {
  const getTareWeightQuery = `
    SELECT tare_weight 
    FROM tos_activities 
    WHERE id = $1 AND activity_type = 10 
  `;
  const tareWeightResult = await pool.query(getTareWeightQuery, [id]);
  console.log("T W :: ", tareWeightResult.rows[0]?.tare_weight);
  if (
    tareWeightResult.rows.length === 0 ||
    tareWeightResult.rows[0].tare_weight === null
  ) {
    throw new Error("No valid tare weight found for this delivery order");
  }

  return tareWeightResult.rows[0]?.tare_weight;
};

const getAllActivityTypes = async (search) => {
  try {
    let query = "SELECT * FROM tos_activity_type";
    const queryParams = [];

    if (search) {
      query += " WHERE name ILIKE $1";
      queryParams.push(`%${search}%`);
    }

    query += " ORDER BY name ASC";

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving customer types:", error);
    throw new Error("Server error");
  }
};

const getWeighbridgePoint = async (weighbridgeId) => {
  try {
    const query = `
      SELECT 
        ap.*,
        array_agg(ci.id) as camera_ids,
        array_agg(ci.model) as camera_models,
        array_agg(ci.ip_address) as camera_ips,
        array_agg(ci.rtsp_url) as camera_rtsp_urls,
        array_agg(ci.status) as camera_statuses,
        array_agg(ci.username) as camera_usernames,
        array_agg(ci.password) as camera_passwords
      FROM tos_activity_points ap
      LEFT JOIN tos_camera_information ci ON ci.id = ANY(ap.camera_ids)
      WHERE ap.id = $1 AND ap.isactive = true
      GROUP BY ap.id
    `;

    const result = await pool.query(query, [weighbridgeId]);
    return result.rows[0];
  } catch (error) {
    console.error("Error retrieving weighbridge point:", error);
    throw new Error("Failed to retrieve weighbridge point data");
  }
};

const getAllActivityPoint = async (search) => {
  try {
    let query = `
      SELECT 
        ap.*,
        array_agg(ci.model) as camera_models,
        array_agg(ci.ip_address) as camera_ips,
        array_agg(ci.status) as camera_statuses,
        array_agg(ci.rtsp_url) as camera_rtsp_urls
      FROM tos_activity_points ap
      LEFT JOIN tos_camera_information ci ON ci.id = ANY(ap.camera_ids)
      GROUP BY ap.id
  `;
    const queryParams = [];

    if (search) {
      query += " WHERE ap.name ILIKE $1";
      queryParams.push(`%${search}%`);
    }

    query += " ORDER BY ap.name ASC";

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving activity points:", error);
    throw new Error("Server error");
  }
};

const getCamerasActivityPoint = async (cameraId) => {

  if(!cameraId) {
    throw new Error("Camera Id is required");
  }

  try {
    let query = `
      SELECT 
        *
      FROM tos_activity_points ap
      where $1 = ANY(ap.camera_ids)
      limit 1
  `;
    const queryParams = [cameraId];

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving activity points:", error);
    throw new Error("Server error");
  }
};

const updatePlateNumber = async (orderId, newPlateNumber) => {
  const client = await pool.connect();
  console.log(newPlateNumber, orderId); //there should be old plate number and new plate number in this payload
  try {
    await client.query("BEGIN");

    if (orderId) {
    }
    const getOrderQuery = `
          SELECT truck_no FROM tos_delivery_orders
          WHERE order_number = $1`;
    const currentOrderResult = await client.query(getOrderQuery, [orderId]);

    if (currentOrderResult.rowCount === 0) {
      throw new Error("Order not found");
    }

    const originalTruckNo = currentOrderResult.rows[0].truck_no;

    const updateOrderQuery = `
          UPDATE tos_delivery_orders 
          SET truck_no = $1, detected_truck_no = $2
          WHERE order_number = $3
          RETURNING *`;
    const orderResult = await client.query(updateOrderQuery, [
      newPlateNumber,
      originalTruckNo,
      orderId,
    ]);

    const updateAnprQuery = `
          UPDATE tos_anpr_table
          SET truck_no = $1, detected_truck_no = $2
          WHERE created_time >= NOW() - INTERVAL '24 hours'
          AND truck_no = $3`;
    await client.query(updateAnprQuery, [
      newPlateNumber,
      originalTruckNo,
      originalTruckNo,
    ]);

    await client.query("COMMIT");
    return {
      success: true,
      data: orderResult.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const updatePlateNumberV2 = async (data) => {
  const client = await pool.connect();
  try {
    const { orderId, newPlateNumber, oldPlateNumber } = data;
    await client.query("BEGIN");

    const findOldTruckQuery =
      "SELECT * FROM tos_anpr_table WHERE truck_no = $1";
    const result = await client.query(findOldTruckQuery, [oldPlateNumber]);

    if (result.rows.length === 0) {
      return {
        success: false,
        message: `Truck with plate number ${oldPlateNumber} not found`,
      };
    }

    const oldTruck = result.rows[0];

    if (orderId) {
      const updateOrderQuery = `
        UPDATE tos_delivery_orders 
        SET truck_no = $1, old_truck_no = $2
        WHERE order_number = $3
        RETURNING *`;
      const orderResult = await client.query(updateOrderQuery, [
        newPlateNumber,
        oldPlateNumber,
        orderId,
      ]);

      if (orderResult.rowCount === 0) {
        throw new Error("Order not found");
      }
    }

    const insertAnprQuery = `
      INSERT INTO tos_anpr_table (truck_no, camera_id, snap_time, old_truck_no, created_time)
      VALUES ($1, $2, NOW(), $3, NOW())
      RETURNING *`;
    const insertValues = [newPlateNumber, oldTruck.camera_id, oldPlateNumber];
    const insertResult = await client.query(insertAnprQuery, insertValues);

    await client.query("COMMIT");
    return {
      success: true,
      data: insertResult.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getAllActivities = async (search, order_no) => {
  console.log("truck_no", search);
  console.log("order_no", order_no);

  try {
    let query = `
      SELECT 
        ord.order_number, 
        ord.truck_no, 
        ord.trailler_no,
        act10.images,
        act10.tare_weight,
        act10.gross_weight, 
        act10.qty AS net_weight,
        act10.id AS activity10_id,
        act10.delivery_order_id AS order10_id,
        act20.gross_weight, 
        act20.qty AS net_weight,
        act20.delivery_order_id AS order20_id,
        act20.id AS activity20_id
      FROM tos_delivery_orders ord
      LEFT JOIN tos_activities act10 
          ON ord.id = act10.delivery_order_id 
          AND act10.activity_type = 10
      LEFT JOIN tos_activities act20 
          ON ord.id = act20.delivery_order_id 
          AND act20.activity_type = 20
    `;

    const queryParams = [];

    if (search) {
      query += ` WHERE ord.truck_no ILIKE $1`;
      queryParams.push(`%${search}%`);
    }

    if (order_no) {
      query += `${search ? " AND" : " WHERE"} ord.order_number = $${
        queryParams.length + 1
      }`;
      queryParams.push(order_no);
    }

    query += " ORDER BY ord.id DESC";

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving activities:", error);
    throw new Error("Server error");
  }
};

const getAllActivitiesV2 = async (search, order_no) => {
  try {
    let query = `
  SELECT 
    ord.id AS delivery_order_id,
    ord.order_number, 
    ord.trailler_no,
    ord.vessel_id,
    ord.product_type_id,
    ord.old_truck_no,
    ord.isactive,
    ord.do_no,
    ord.order_type,
    ord.stock_transfer_code,

    cust.name AS customer_name,
    drv.name AS driver_name,
    drv.license_no AS driver_phone,

    sw_ap.name AS sw_wb,
    fw_ap.name AS fw_wb,

    COALESCE(
          json_agg(
            jsonb_build_object(
              'quantity', f_ord.measurement, 
              'name', prod.name,
              'unit', f_ord.unit
            )
          ) FILTER (WHERE ord.product_type_id IS NULL),
          '[]'::json
        ) AS products,


    act10.truck_no AS truck_no,
    act10.images,
    act10.tare_weight,
    act10.gross_weight AS gross_weight, 
    act10.qty AS net_weight,
    act10.id AS activity10_id,
    act10.delivery_order_id AS order10_id,
    act10.created_at as created10_at,
    act10.sw_at as sw10_at,
    act10.fw_by as fw10_by,
    act10.sw_by as sw10_by,
    act10.avrg_w AS avrg_w,
    act10.reason AS reason,
    act10.sw_truck_no AS sw_truck_no,
    CONCAT(fw10_user.first_name, ' ', fw10_user.last_name) AS fw10_name,
    fw10_user.phone AS fw10_phone,
    CONCAT(sw10_user.first_name, ' ', sw10_user.last_name) AS sw10_name,
    sw10_user.phone AS sw10_phone,

    act20.gross_weight AS gross_weight_20, 
    act20.qty AS net_weight_20,
    act20.delivery_order_id AS order20_id,
    act20.created_at as created20_at,
    act20.id AS activity20_id,
    act20.sw_at as sw20_at,
    act20.fw_by as fw20_by,
    act20.sw_by as sw20_by,
    act20.avrg_w AS avrg_w_20,
    CONCAT(fw20_user.first_name, ' ', fw20_user.last_name) AS fw20_name,
    fw20_user.phone AS fw20_phone,
    CONCAT(sw20_user.first_name, ' ', sw20_user.last_name) AS sw20_name,
    sw20_user.phone AS sw20_phone

  FROM tos_delivery_orders ord
  LEFT JOIN tos_activities act10 
      ON ord.id = act10.delivery_order_id AND act10.activity_type = 10
  LEFT JOIN tos_activities act20 
      ON ord.id = act20.delivery_order_id AND act20.activity_type = 20

  LEFT JOIN tos_users fw10_user ON fw10_user.id = act10.fw_by
  LEFT JOIN tos_users sw10_user ON sw10_user.id = act10.sw_by
  LEFT JOIN tos_users fw20_user ON fw20_user.id = act20.fw_by
  LEFT JOIN tos_users sw20_user ON sw20_user.id = act20.sw_by
  
  LEFT JOIN tos_activity_points sw_ap ON sw_ap.id = act10.sw_wb
  LEFT JOIN tos_activity_points fw_ap ON fw_ap.id = act10.fw_wb

  LEFT JOIN tos_activity_points sw20_ap ON sw20_ap.id = act20.sw_wb
  LEFT JOIN tos_activity_points fw20_ap ON fw20_ap.id = act10.sw_wb

  LEFT JOIN tos_customer cust ON ord.customer_id = cust.id
  LEFT JOIN tos_drivers drv ON ord.driver_id = drv.id

  LEFT JOIN tos_finished_orders f_ord ON f_ord.delivery_order_id = ord.id
  LEFT JOIN tos_product prod ON prod.id = f_ord.product_id

`;

    const queryParams = [];
    let whereClauses = [];

    if (search) {
      queryParams.push(`%${search}%`);
      whereClauses.push(`ord.truck_no ILIKE $${queryParams.length}`);
    }

    if (order_no) {
      queryParams.push(order_no);
      whereClauses.push(`ord.order_number = $${queryParams.length}`);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    // Add ordering

    query += `
      GROUP BY 
    ord.id, cust.name, drv.name, drv.license_no,
    act10.id, act20.id,
    fw10_user.id, sw10_user.id, fw20_user.id, sw20_user.id,sw_ap.name, fw_ap.name,
    sw20_ap.name, fw20_ap.name
  
    
    ORDER BY 
    (act10.qty IS NULL) ASC,
    ord.id DESC`;

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving activities:", error);
    console.error("Error retrieving activities:", error.message);
    throw new Error("Server error");
  }
};

const getTruckActivities = async (search, weighbridge_id, editing) => {
  try {
    const queryParams = [];
    let paramIndex = 1;

    let whereClause = `WHERE created_time >= NOW() - INTERVAL '${
      editing ? 30 : 40
    } seconds'`;

    if (weighbridge_id) {
      whereClause += ` AND camera_id = $${paramIndex}`;
      queryParams.push(weighbridge_id);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND truck_no LIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const query = `
      WITH LatestANPR AS (
        SELECT 
          camera_id,
          created_time,
          truck_no,
          is_unlicensed,
          camera_ip
        FROM tos_anpr_table
        ${whereClause}
        ORDER BY created_time DESC
        LIMIT 2
      )
      SELECT 
        la.camera_id as activitypoint,
        point.address,
        la.truck_no,
        la.created_time,
        la.is_unlicensed,
        cam.model as camera_model,
        cam.ip_address as camera_ip
      FROM LatestANPR la
      LEFT JOIN tos_activity_points point ON point.id = la.camera_id
      LEFT JOIN tos_camera_information cam ON cam.id = la.camera_ip
      ORDER BY la.created_time DESC
    `;

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving activities:", error);
    throw new Error("Server error");
  }
};

const getTruckOnWb = async (search, wbId) => {
  try {
    console.log("wbId", wbId);
    console.log("search", search);
    if (!wbId) {
      throw new Error("wbId (camera_id) is required");
    }

    const query = `
      SELECT 
        anpr.camera_id as activitypoint,
        point.address,
        anpr.truck_no,
        anpr.created_time
      FROM tos_anpr_table anpr
      LEFT JOIN tos_activity_points point ON point.id = anpr.camera_id
      WHERE anpr.camera_id = $1 
      ORDER BY anpr.created_time DESC
      LIMIT 2
    `;

    const result = await pool.query(query, [wbId]);

    // const latestEntry = result.rows[0];

    if (!(result.rows.length > 0)) return null;

    let latestEntry = null;
    result.rows.forEach((lEntry) => {
      console.log("Latest Entry:", lEntry);
      // Match truck number if `search` is provided
      if (search) {
        const normalizedSearch = search.trim().toLowerCase();
        const normalizedTruck = lEntry.truck_no?.trim().toLowerCase();
        if (normalizedSearch === normalizedTruck) {
          latestEntry = lEntry;
        }
      }
    });

    if (!latestEntry) {
      return null;
    }

    return latestEntry;
  } catch (error) {
    console.error("Error retrieving latest truck:", error);
    throw new Error("Server error");
  }
};

const getTruckImages = async (truck_no) => {
  try {
    const query = `
      SELECT images 
      FROM tos_activities 
      WHERE truck_no = $1 
      AND images IS NOT NULL 
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [truck_no]);

    if (result.rows.length > 0) {
      return result.rows[0].images;
    }
    return null;
  } catch (error) {
    console.error("Error retrieving activities:", error);
    throw new Error("Server error");
  }
};

//   '[]'::jsonb
// ) AS products,
//get activity by id
const getActivity = async (delivery_order_id) => {
  try {
    let query = `
      SELECT 
        ord.id AS delivery_order_id,
        ord.order_number, 
        ord.truck_no, 
        ord.trailler_no,
        ord.vessel_id,
        ord.product_type_id,
        ord.old_truck_no,
        ord.isactive,
        ord.do_no,

        cust.name AS customer_name,
        drv.name AS driver_name,
        drv.license_no AS driver_phone,

        COALESCE(
          json_agg(
            jsonb_build_object(
              'name', prod.name,
              'quantity', f_ord.measurement,
              'unit', f_ord.unit,
              'packing_type', vprod.name
            )
          ) FILTER (WHERE ord.product_type_id IS NULL),
             json_agg(
    jsonb_build_object(
      'name', ptype.name,
      'packing_type', packtype.name,
      'vessel_type', vtype.name,
      'wheat_type', wtype.name
    )
  ) FILTER (WHERE ord.product_type_id IS NOT NULL),
          '[]'::json
        ) AS products,

        act10.images,
        act10.tare_weight,
        act10.gross_weight AS gross_weight, 
        act10.qty AS net_weight,
        act10.id AS activity10_id,
        act10.delivery_order_id AS order10_id,
        act10.created_at as created10_at,
        act10.sw_at as sw10_at,
        act10.fw_by as fw10_by,
        act10.sw_by as sw10_by,
        CONCAT(fw10_user.first_name, ' ', fw10_user.last_name) AS fw10_name,
        fw10_user.phone AS fw10_phone,
        CONCAT(sw10_user.first_name, ' ', sw10_user.last_name) AS sw10_name,
        sw10_user.phone AS sw10_phone,

        act20.gross_weight AS gross_weight_20, 
        act20.qty AS net_weight_20,
        act20.delivery_order_id AS order20_id,
        act20.created_at as created20_at,
        act20.id AS activity20_id,
        act20.sw_at as sw20_at,
        act20.fw_by as fw20_by,
        act20.sw_by as sw20_by,
        CONCAT(fw20_user.first_name, ' ', fw20_user.last_name) AS fw20_name,
        fw20_user.phone AS fw20_phone,
        CONCAT(sw20_user.first_name, ' ', sw20_user.last_name) AS sw20_name,
        sw20_user.phone AS sw20_phone

      FROM tos_delivery_orders ord
      LEFT JOIN tos_activities act10 
          ON ord.id = act10.delivery_order_id AND act10.activity_type = 10
      LEFT JOIN tos_activities act20 
          ON ord.id = act20.delivery_order_id AND act20.activity_type = 20

      LEFT JOIN tos_users fw10_user ON fw10_user.id = act10.fw_by
      LEFT JOIN tos_users sw10_user ON sw10_user.id = act10.sw_by
      LEFT JOIN tos_users fw20_user ON fw20_user.id = act20.fw_by
      LEFT JOIN tos_users sw20_user ON sw20_user.id = act20.sw_by

      LEFT JOIN tos_customer cust ON ord.customer_id = cust.id
      LEFT JOIN tos_drivers drv ON ord.driver_id = drv.id

      LEFT JOIN tos_finished_orders f_ord ON f_ord.delivery_order_id = ord.id
      LEFT JOIN tos_product prod ON prod.id = f_ord.product_id
       LEFT JOIN tos_packing_type vprod ON vprod.id = f_ord.packing_type_id

      LEFT JOIN tos_product_type ptype ON ptype.id = ord.product_type_id
      LEFT JOIN tos_packing_type packtype ON packtype.id = ord.packing_type_id
      LEFT JOIN tos_vessel vtype ON vtype.id = ord.vessel_id
      LEFT JOIN tos_wheat_type wtype ON wtype.id = ord.wheat_type_id
    `;

    const queryParams = [];
    let whereClauses = [];

    if (delivery_order_id) {
      queryParams.push(delivery_order_id);
      whereClauses.push(`ord.id = $${queryParams.length}`);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    query += `
      GROUP BY 
        ord.id, cust.name, drv.name, drv.license_no,
        act10.id, act20.id,
        fw10_user.id, sw10_user.id, fw20_user.id, sw20_user.id,
        ptype.name, packtype.name, vtype.name, wtype.name

      ORDER BY 
        (act10.qty IS NULL) ASC,
        ord.id DESC
    `;

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving activities:", error);
    throw new Error("Server error");
  }
};
const approveActivity = async ({ id, reason, user }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const verifyActivityQuery = `
    UPDATE tos_activities
    SET approved_by =$1,
        reason=$2,
        isactive=$3,
        approved_at=NOW()
    WHERE id=$4
    RETURNING *
  `;
    const values = [user.id, reason, false, id];
    const { rowCount, rows } = await client.query(verifyActivityQuery, values);
    if (rowCount === 0) {
      throw new Error("Activity not found");
    }
    //update tos_delivery_order

    const { delivery_order_id } = rows[0];

    await client.query(
      `UPDATE tos_delivery_orders SET isactive = false WHERE id = $1`,
      [delivery_order_id]
    );

    await client.query("COMMIT");
    return {
      success: true,
      data: rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
module.exports = {
  createOrUpdateActivityType,
  createOrUpdateActivityPoint,
  createOrUpdateActivity,
  createOrUpdateActivityV2,
  createOrUpdateCamera,
  updatePlateNumber,
  updatePlateNumberV2,
  getAllActivityTypes,
  getAllActivityPoint,
  getCamerasActivityPoint,
  getAllActivities,
  getAllActivitiesV2,
  getTruckActivities,
  getTruckOnWb,
  getAllCameras,
  getWeighbridgePoint,
  getTruckImages,
  getActivity,
  approveActivity,
};
