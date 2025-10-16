const vessels = require("../services/vesselService");

const createOrUpdateVesselType = async (req, res) => {
  const { name, isactive } = req.body;

  // Check for missing fields
  if (!name || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Name and isactive status are required",
    });
  }

  // Convert the name to uppercase
  const vesselTypeName = name.toUpperCase();

  try {
    // Call the service function to check and either create or update the vessel type
    const result = await vessels.createOrUpdateVesselType(vesselTypeName, isactive);

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

const createOrUpdateVessel = async (req, res) => {
  const { name, isactive,  } = req.body;
    const vessel_type_id = 1;
  // Validate the input fields
  if (!name || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Name, isactive and statusare required",
    });
  }

  // Convert vessel name to uppercase
  const vesselNameUpper = name.toUpperCase();

  try {
    // Call the service function to either create or update the vessel
    const result = await vessels.createOrUpdateVessel(vesselNameUpper, isactive, vessel_type_id);

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

// Controller to get all vessel types
const getAllVesselTypes = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const { search } = req.query;

    // Call the service function with the search query
    const vesselTypes = await vessels.getAllVesselTypes(search);

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

// Controller to get all vessels
const getAllVessels = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const { search } = req.query;

    // Call the service function with the search query
    const vesselsList = await vessels.getAllVessels(search);

    // Send the response with the filtered vessels
    res.status(200).json({
      success: true,
      data: vesselsList,
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

module.exports = {
  createOrUpdateVesselType,
  createOrUpdateVessel,
  getAllVesselTypes,
  getAllVessels,
};
