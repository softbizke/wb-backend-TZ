const productLimitService = require("../services/productWeightLimit.service");
const createOrUpdateProductWeightLimits = async (req, res) => {
  const requiredFields = [
    "weight",
    "max",
    "min",
    "size",
    "isactive",
    "weighbridge",
  ];

  for (const key of Object.keys(req.body)) {
    if (
      requiredFields.includes(key) &&
      (req.body[key] === undefined || req.body[key] === null)
    ) {
      return res.status(400).json({
        success: false,
        message: `${key} is required`,
      });
    }
  }

  try {
    // Call the service function to either create or update the vessel
    const result = await productLimitService.createOrUpdateProductWeightLimit(
      req.body
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

// Controller to get all vessels
const getAllProductWeightLimits = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const { search } = req.query;

    // Call the service function with the search query
    const limitLists = await productLimitService.getAllProductWeightLimits(
      search
    );

    // Send the response with the filtered vessels
    res.status(200).json({
      success: true,
      data: limitLists,
    });
  } catch (error) {
    console.error("Error in getAllVessels:", error);

    // Send error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve vessels",
    });
  }
};
//get weight limit by weight

const getProductWeightLimit = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res
        .status(404)
        .json({ success: false, message: `Name is required` });
    }
    const result = await productLimitService.getProductWeightLimit(name);
    if (result.success) {
      return res.status(200).json({ success: true, data: result.data });
    } else {
      return res.status(404).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Controller to delete a product weight limit
const deleteProductWeightLimit = async (req, res) => {
  const { id } = req.params;

  try {
    // Call the service function to delete the product weight limit
    const result = await productLimitService.deleteProductWeightLimit(id);

    // Return response based on the result
    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(404).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
//createWeightLimitsBulk
const createWeightLimitsBulk = async (req, res) => {
  try {
    const result = await productLimitService.createWeightLimitsBulk(req.body);

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(404).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createOrUpdateProductWeightLimits,
  getAllProductWeightLimits,
  getProductWeightLimit,
  deleteProductWeightLimit,
  createWeightLimitsBulk,
};
