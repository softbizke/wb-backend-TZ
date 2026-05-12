const dispatchTypeService = require("../services/dispatchTypeService");

// Controller to create or update a dispatch type
const createOrUpdateDispatchType = async (req, res) => {
  const { title, isactive } = req.body;

  if (!title || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "title and isactive status are required",
    });
  }

  try {
    const result = await dispatchTypeService.createOrUpdateDispatchType(
      title,
      isactive
    );

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error("Error in createOrUpdateDispatchType:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Controller to get all dispatch types
const getAllDispatchTypes = async (req, res) => {
  try {
    const { search } = req.query;
    const result = await dispatchTypeService.getAllDispatchTypes(search);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getAllDispatchTypes:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve dispatch types" });
  }
};

// Controller to get or create dispatch type by title
const getOrCreateDispatchTypeByTitle = async (req, res) => {
  const { title, isactive } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: "title is required",
    });
  }

  try {
    const id = await dispatchTypeService.getOrCreateDispatchTypeByTitle(title, isactive);
    res.status(200).json({ success: true, id });
  } catch (error) {
    console.error("Error in getOrCreateDispatchTypeByTitle:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createOrUpdateDispatchType,
  getAllDispatchTypes,
  getOrCreateDispatchTypeByTitle,
};
