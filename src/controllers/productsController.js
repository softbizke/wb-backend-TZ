const products = require("../services/productService");

const createOrUpdateProductType = async (req, res) => {
  console.log("Received request body:", req.body);
  const { name, isactive, packing_type_id } = req.body;

  if (!name || typeof isactive !== "boolean" || !packing_type_id) {
    return res.status(400).json({
      success: false,
      message: "missing fields required",
    });
  }

  const productTypeName = name.toUpperCase();

  try {
    const result = await products.createOrUpdateProductType(
      productTypeName,
      isactive,
      packing_type_id
    );

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

const createOrUpdateProduct = async (req, res) => {
  const { name, isactive, product_type } = req.body;

  // Validate the input fields
  if (!name || typeof isactive !== "boolean" || !product_type) {
    return res.status(400).json({
      success: false,
      message: "Name, isactive status, and product_type are required",
    });
  }

  // Convert product name and product type name to uppercase
  const productNameUpper = name.toUpperCase();
  //const productTypeNameUpper = product_type_name.toUpperCase();

  try {
    // Call the service function to either create or update the product
    const result = await products.createOrUpdateProduct(
      productNameUpper,
      isactive,
      product_type
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
const getAllProductsTypes = async (req, res) => {
  try {
    const { search } = req.query;

    const productTypes = await products.getAllProductTypes(search);

    res.status(200).json({
      success: true,
      data: productTypes,
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
const getAllProducts = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const { search } = req.query;

    // Call the service function with the search query
    const customerTypes = await products.getAllProducts(search);

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

const updateProductType = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await products.updateProductType(id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createOrUpdateWheatType = async (req, res) => {
  const { name, isactive } = req.body;

  // Check for missing fields
  if (!name || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Name and isactive status are required",
    });
  }

  // Convert the name to uppercase
  const wheatTypeName = name.toUpperCase();

  try {
    // Call the service function to check and either create or update the vessel type
    const result = await products.createOrUpdateWheatType(
      wheatTypeName,
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
const getAllWheatTypes = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const { search } = req.query;

    // Call the service function with the search query
    const vesselTypes = await products.getAllWheatTypes(search);

    // Send the response with the filtered vessel types
    res.status(200).json({
      success: true,
      data: vesselTypes,
    });
  } catch (error) {
    console.error("Error in getAllVesselTypes:", error);

    // Send error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve vessel types",
    });
  }
};
module.exports = {
  createOrUpdateProductType,
  createOrUpdateProduct,
  getAllProductsTypes,
  getAllProducts,
  updateProductType,
  createOrUpdateWheatType,
  getAllWheatTypes,
};
