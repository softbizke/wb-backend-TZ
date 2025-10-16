const packing = require("../services/packingservice");

const createOrUpdatePackingType = async (req, res) => {
    const { name, isactive } = req.body;
  
    // Check for missing fields
    if (!name || typeof isactive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "Name and isactive status are required",
      });
    }
  
    // Convert the name to uppercase
    const packingTypeName = name.toUpperCase();
  
    try {
      // Call the service function to check and either create or update the packing type
      const result = await packing.createOrUpdatePackingType(packingTypeName, isactive);
  
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

  const createOrUpdatePacking = async (req, res) => {
    const { name, isactive, packing_type } = req.body;
  
    // Validate the input fields
    if (!name || typeof isactive !== 'boolean' || !packing_type) {
      return res.status(400).json({
        success: false,
        message: "Name, isactive status, and packing_type are required",
      });
    }
  
    // Convert product name and product type name to uppercase
    const packingNameUpper = name.toUpperCase();
    //const productTypeNameUpper = product_type_name.toUpperCase();
  
    try {
      // Call the service function to either create or update the product
      const result = await packing.createOrUpdatePacking(packingNameUpper, isactive, packing_type);
  
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

    // Controller to get all packing types
  const getAllPackingTypes = async (req, res) => {
    try {
      // Extract the search query from request parameters
      const { search } = req.query;
  
      // Call the service function with the search query
      const packingTypes = await packing.getAllPackingTypes(search);
  
      // Send the response with the filtered customer types
      res.status(200).json({
        success: true,
        data: packingTypes,
      });
    } catch (error) {
      console.error("Error in getAllPackingType:", error);
  
      // Send error response
      res.status(500).json({
        success: false,
        message: "Failed to retrieve packing types",
      });
    }
  };
  
  // Controller to get all customer types
  const getAllPacking = async (req, res) => {
    try {
      // Extract the search query from request parameters
      const { search } = req.query;
  
      // Call the service function with the search query
      const packingTypes = await packing.getAllPacking(search);
  
      // Send the response with the filtered customer types
      res.status(200).json({
        success: true,
        data: packingTypes,
      });
    } catch (error) {
      console.error("Error in getAllCustomerType:", error);
  
      // Send error response
      res.status(500).json({
        success: false,
        message: "Failed to retrieve packing",
      });
    }
  };
  
  
  

  module.exports = {
    createOrUpdatePackingType,
    createOrUpdatePacking,
    getAllPackingTypes,
    getAllPacking
  };
  