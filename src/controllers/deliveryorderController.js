const deliveryOrders = require("../services/deliveryorderService");
const { v4: uuidv4 } = require("uuid"); // Import the uuid library

const createDeliveryOrder = async (req, res) => {
  const {
    truck_no,
    old_truck_no,
    trailer_no,
    customer,
    driver,
    measurement,
    packing_type,
    do_no,
    activity_check = 0,
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
    offloading_location,
  } = req.body;

  // console.log("REQ BODY", req.body);

  // Validate the input fields
  if (!truck_no || !customer || !packing_type || !do_no) {
    return res.status(400).json({
      success: false,
      message:
        "truck_no, customer, do_no, and packing_type are required",
    });
  }

  try {
    // Call the service function to either create or update the delivery order
    const result = await deliveryOrders.createDeliveryOrder(
      truck_no,
      old_truck_no,
      trailer_no,
      customer,
      driver,
      measurement,
      packing_type,
      do_no,
      activity_check,
      order_type,
      order_items,
      transporter_id,
      buying_center_id,
      supplier_id,
      purchase_type_id,
      transaction_type,
      source,
      destination,
      packing_id,
      offloading_location,
    );

    // Return response based on the result
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        orderNumber: result.orderNumber,
      });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const createDeliveryAndFinishedOrder = async (req, res) => {
  try {
    // Extract data from the request body
    const {
      order_id,
      truck_no,
      trailer_no,
      customer_id, // optional
      stock_transfer_code, //optional
      driver_id, // Optional
      measurement,
      product_type, // Optional
      supplier_id,
      // packing_type,
      order_items,
      transporter_id,
      buying_center_id,
      purchase_type_id,
      offloading_location,
    } = req.body;

    console.log("ORD", req.body);

    // Validate required fields
    if (!truck_no || !(customer_id || supplier_id) || !order_items) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: truck_no, customer_id/supplier_id and order_items are mandatory.",
      });
    }

    // Call the service function
    const result = await deliveryOrders.createDeliveryAndFinishedOrderV2(
      order_id,
      truck_no,
      trailer_no || null, // Pass null if undefined
      customer_id,
      driver_id || null,
      measurement || 0, // Default to 0 if undefined
      // product_type || null, // Pass null if undefined
      1, //packing_type,
      transporter_id || null,
      buying_center_id || null,
      supplier_id || null, // Pass null if undefined
      purchase_type_id || null,
      offloading_location || null,
      order_items,
    );

    // Return the result
    if (result.success) {
      return res.status(201).json({
        success: true,
        message: result.message,
        delivery_order_id: result.delivery_order_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error in createDeliveryOrderController:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const updateDeliveryOrderController = async (req, res) => {
  const { order_number, isactive } = req.body;

  try {
    // Validate if order_number and isactive are provided
    if (!order_number || typeof isactive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Order number and isactive status are required",
      });
    }

    // Call the service function to update the delivery order
    const result = await deliveryOrders.updateDeliveryOrder(
      order_number,
      isactive,
    );

    // Return response based on the result from the service
    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Controller to get all activity types
const getAllDeliveryorders = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const {
      search,
      order_number,
      do_no,
      truck_no,
      customer,
      created_at,
      isactive,
      limit,
    } = req.query;

    // Call the service function with the search query
    const customerTypes = await deliveryOrders.getAllDeliveryorders(
      search,
      order_number,
      do_no,
      truck_no,
      customer,
      created_at,
      isactive,
      limit,
    );

    // Send the response with the filtered customer types
    res.status(200).json({
      success: true,
      data: customerTypes,
    });
  } catch (error) {
    console.error("Error in getAllCAllactivittyType:", error);

    // Send error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve Activity types",
    });
  }
};

//get summary stats

module.exports = {
  createDeliveryOrder,
  updateDeliveryOrderController,
  getAllDeliveryorders,
  createDeliveryAndFinishedOrder,
};
