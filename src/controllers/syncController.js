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

// Temporary WB ticket details backfill handler.
// Uncomment with the service method and route when another CMS backfill is needed.
// const backfillWeighbridgeTicketDetails = async (req, res) => {
//   try {
//     const result = await syncService.backfillWeighbridgeTicketDetails();
//
//     return res.status(result.success ? 200 : 500).json(result);
//   } catch (error) {
//     console.error("WB ticket details backfill failed:", error);
//     return res.status(500).json({
//       success: false,
//       message: "WB ticket details backfill failed",
//       error: error.message,
//     });
//   }
// };

// One-time buying center refresh handler.
// If uncommented, this exposes the service method that fetches CMS buying
// centers changed since Jan 1, 2026 and updates existing local rows by cms_id.
// const manualUpdateBuyingCentersFrom2026 = async (req, res) => {
//   try {
//     const result = await syncService.manualUpdateBuyingCentersFrom2026();
//
//     return res.status(result.success ? 200 : 500).json(result);
//   } catch (error) {
//     console.error("Manual buying center update failed:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Manual buying center update failed",
//       error: error.message,
//     });
//   }
// };

module.exports = {
  runSync,
  // backfillWeighbridgeTicketDetails,
  // manualUpdateBuyingCentersFrom2026,
};
