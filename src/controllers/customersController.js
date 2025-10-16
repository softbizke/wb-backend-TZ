const customers = require("../services/customerService");

const createOrUpdateCustomerType = async (req, res) => {
  const { name, isactive } = req.body;

  // Check for missing fields
  if (!name || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Name and isactive status are required",
    });
  }

  // Convert the name to uppercase
  const customerTypeName = name.toUpperCase();

  try {
    // Call the service function to check and either create or update the customer type
    const result = await customers.createOrUpdateCustomerType(
      customerTypeName,
      isactive
    );

    // Return response based on the result
    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateCustomerById = async (req, res) => {
  const { name, isactive, customer_type_name } = req.body;
  // Check for missing fields
  if (!name || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Name and isactive status are required",
    });
  }

  try {
    // Call the service function to check and either create or update the customer type
    const result = await customers.updateCustomerById(req.body);

    // Return response based on the result
    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const createOrUpdateCustomer = async (req, res) => {
  const { name, isactive, customer_type_name } = req.body;

  // Validate the input fields
  if (!name || typeof isactive !== "boolean" || !customer_type_name) {
    return res.status(400).json({
      success: false,
      message: "Name, isactive status, and customer_type_name are required",
    });
  }

  //console.log (customer_type_name);

  // Convert customer type name to uppercase
  //const customerTypeName =customer_type_name.toUpperCase();

  try {
    // Call the service function to either create or update the customer
    const result = await customers.createOrUpdateCustomer(
      name,
      isactive,
      customer_type_name
    );

    // Return response based on the result
    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getOrCreateCustomerByCode = async (req, res) => {
  const { name, bp_code, customer_type_id, isactive } = req.body;

  // Validate the input fields
  if (!name || typeof isactive !== "boolean" || !customer_type_id || !bp_code) {
    return res.status(400).json({
      success: false,
      message: "Name, isactive status, and customer_type_id are required",
    });
  }

  try {
    // Call the service function to either create or update the customer
    const result = await customers.getOrCreateCustomerByCode(req.body);
    // Return response based on the result
    return res.status(200).json({ success: true, id: result });
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Controller to get all customer types
const getAllCustomerTypes = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const { search } = req.query;

    // Call the service function with the search query
    const customerTypes = await customers.getAllCustomerTypes(search);

    // Send the response with the filtered customer types
    res.status(200).json({
      success: true,
      data: customerTypes,
    });
  } catch (error) {
    console.error("Error in getAllCustomerType:", error);

    // Send error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve customer types",
    });
  }
};

// Controller to get all customer types
const getAllCustomer = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const { search } = req.query;

    // Call the service function with the search query
    const customerTypes = await customers.getAllCustomer(search);

    // Send the response with the filtered customer types
    res.status(200).json({
      success: true,
      data: customerTypes,
    });
  } catch (error) {
    console.error("Error in getAllCustomerType:", error);

    // Send error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve customer types",
    });
  }
};

module.exports = {
  createOrUpdateCustomerType,
  createOrUpdateCustomer,
  getAllCustomerTypes,
  getAllCustomer,
  updateCustomerById,
  getOrCreateCustomerByCode,
};
