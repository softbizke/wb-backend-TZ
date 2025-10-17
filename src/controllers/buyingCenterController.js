const buyingCenterService = require("../services/buyingCenterService");

// Controller to create or update a buying center
const createOrUpdateBuyingCenter = async (req, res) => {
  const { title, isactive } = req.body;

  if (!title || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "title and isactive status are required",
    });
  }

  try {
    const result = await buyingCenterService.createOrUpdateBuyingCenter(
      title,
      isactive
    );

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error("Error in createOrUpdateBuyingCenter:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Controller to get all buying centers
const getAllBuyingCenters = async (req, res) => {
  try {
    const { search } = req.query;
    const result = await buyingCenterService.getAllBuyingCenters(search);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getAllBuyingCenters:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve buying centers" });
  }
};

// Controller to get or create buying center by title
const getOrCreateBuyingCenterByTitle = async (req, res) => {
  const { title, isactive } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: "title is required",
    });
  }

  try {
    const id = await buyingCenterService.getOrCreateBuyingCenterByTitle(title, isactive);
    res.status(200).json({ success: true, id });
  } catch (error) {
    console.error("Error in getOrCreateBuyingCenterByTitle:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createOrUpdateBuyingCenter,
  getAllBuyingCenters,
  getOrCreateBuyingCenterByTitle,
};
