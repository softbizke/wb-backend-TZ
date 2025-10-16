const weigbridge = require("../services/weighbridgeService");

  // Controller to get all activity types
  const getWeights = async (req, res) => {
    try {
      // Extract the search query from request parameters
      const { activity_point } = req.query;
      console.log(activity_point);
  
      // Call the service function with the search query
      const weight = await weigbridge.getWeights(activity_point);
  
      // Send the response with the filtered customer types
      res.status(200).json({
        success: true,
        data: weight,
      });
    } catch (error) {
      console.error("Error in getAllCAllactivittyType:", error);
  
      // Send error response
      res.status(500).json({
        success: false,
        message: "Failed to retrieve Activity types",
      });
    }
  };

  module.exports = {
    getWeights
  };
