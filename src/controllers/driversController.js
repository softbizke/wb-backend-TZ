const drivers = require("../services/driverService");

//controller to create or update the driver
const createOrUpdateDriver = async (req, res) => {
  const { id_no, name, license_no, isactive } = req.body;

  // Validate the input fields
  if (!id_no || !name || !license_no || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "id_no, name, licence_no, and isactive status are required",
    });
  }

  try {
    // Call the service function to either create or update the driver
    const result = await drivers.createOrUpdateDriver(
      id_no,
      name,
      license_no,
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

// Controller to get all customer types
const getAllDrivers = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const { name, id_no } = req.query;
    console.log(id_no, name);

    // Call the service function with the search query
    const customerTypes = await drivers.getAllDrivers(name);

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
const getOrCreateDriverByID = async (req, res) => {
  const { id } = req.body;

  // Validate the input field
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "ID is required",
    });
  }

  try {
    // Call the service function to either create or find the driver by code
    const result = await drivers.getOrCreateDriverByID(req.body);

    // Return response based on the result

    return res.status(200).json({ success: true, id: result });
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createOrUpdateDriver,
  getAllDrivers,
  getOrCreateDriverByID,
};
