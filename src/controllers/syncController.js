const syncService = require("../services/syncService");

const runSync = async (req, res) => {
  try {
    const result = await syncService.syncAll("Manual");

    if (result.skipped) {
      return res.status(409).json(result);
    }

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Manual sync failed:", error);
    return res.status(500).json({
      success: false,
      message: "Manual sync failed",
      error: error.message,
    });
  }
};

module.exports = {
  runSync,
};
