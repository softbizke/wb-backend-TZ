const destinationService = require("../services/destinationService");

// Controller to create or update a destination
const createOrUpdateDestination = async (req, res) => {
  const { title, isactive } = req.body;
  const type = destinationService.normalizeDestinationType(req.body.type);

  // Validate the input fields
  if (
    !title ||
    typeof isactive !== "boolean" ||
    !destinationService.isValidDestinationType(type)
  ) {
    return res.status(400).json({
      success: false,
      message: "title, isactive status, and valid type are required",
    });
  }

  try {
    const result = await destinationService.createOrUpdateDestination(
      title,
      isactive,
      type
    );

    return res
      .status(200)
      .json({ success: true, message: result.message });
  } catch (error) {
    console.error("Error in createOrUpdateDestination:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Controller to get all destinations
const getAllDestinations = async (req, res) => {
  try {
    const { search } = req.query;
    const type = destinationService.normalizeDestinationType(req.query.type || "all");

    if (type !== "all" && !destinationService.isValidDestinationType(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be internal, external, or all",
      });
    }

    const result = await destinationService.getAllDestinations(search, type);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getAllDestinations:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve destinations" });
  }
};

// Controller to get or create destination by title
const getOrCreateDestinationByTitle = async (req, res) => {
  const { title, isactive } = req.body;
  const type = destinationService.normalizeDestinationType(req.body.type);

  if (!title || !destinationService.isValidDestinationType(type)) {
    return res.status(400).json({
      success: false,
      message: "title and valid type are required",
    });
  }

  try {
    const id = await destinationService.getOrCreateDestinationByTitle(title, isactive, type);
    res.status(200).json({ success: true, id });
  } catch (error) {
    console.error("Error in getOrCreateDestinationByTitle:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createOrUpdateDestination,
  getAllDestinations,
  getOrCreateDestinationByTitle,
};
