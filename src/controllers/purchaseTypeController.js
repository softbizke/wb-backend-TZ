const purchaseTypeService = require("../services/purchaseTypeService");

// Controller to create or update a purchase type
const createOrUpdatePurchaseType = async (req, res) => {
  const { title, isactive } = req.body;

  if (!title || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "title and isactive status are required",
    });
  }

  try {
    const result = await purchaseTypeService.createOrUpdatePurchaseType(
      title,
      isactive
    );

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error("Error in createOrUpdatePurchaseType:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Controller to get all purchase types
const getAllPurchaseTypes = async (req, res) => {
  try {
    const { search } = req.query;
    const result = await purchaseTypeService.getAllPurchaseTypes(search);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getAllPurchaseTypes:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve purchase types" });
  }
};

// Controller to get or create purchase type by title
const getOrCreatePurchaseTypeByTitle = async (req, res) => {
  const { title, isactive } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: "title is required",
    });
  }

  try {
    const id = await purchaseTypeService.getOrCreatePurchaseTypeByTitle(title, isactive);
    res.status(200).json({ success: true, id });
  } catch (error) {
    console.error("Error in getOrCreatePurchaseTypeByTitle:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createOrUpdatePurchaseType,
  getAllPurchaseTypes,
  getOrCreatePurchaseTypeByTitle,
};
