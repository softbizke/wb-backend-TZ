const transporterService = require("../services/transporterService");

// Controller to create or update a transporter
const createOrUpdateTransporter = async (req, res) => {
  const { title, isactive } = req.body;

  // Validate the input fields
  if (!title || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "title and isactive status are required",
    });
  }

  try {
    const result = await transporterService.createOrUpdateTransporter(
      title,
      isactive
    );

    return res
      .status(200)
      .json({ success: true, message: result.message });
  } catch (error) {
    console.error("Error in createOrUpdateTransporter:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Controller to get all transporters
const getAllTransporters = async (req, res) => {
  try {
    const { title } = req.query;
    const result = await transporterService.getAllTransporters(title);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getAllTransporters:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve transporters" });
  }
};

// Controller to get or create transporter by title
const getOrCreateTransporterByTitle = async (req, res) => {
  const { title, isactive } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: "title is required",
    });
  }

  try {
    const id = await transporterService.getOrCreateTransporterByTitle(title, isactive);
    res.status(200).json({ success: true, id });
  } catch (error) {
    console.error("Error in getOrCreateTransporterByTitle:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createOrUpdateTransporter,
  getAllTransporters,
  getOrCreateTransporterByTitle,
};
