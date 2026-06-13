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

const manualSyncCmsMasterDataFrom2026 = async (req, res) => {
  try {
    const result = await syncService.manualSyncCmsMasterDataFrom2026();

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Manual CMS master data sync failed:", error);
    return res.status(500).json({
      success: false,
      message: "Manual CMS master data sync failed",
      error: error.message,
    });
  }
};

// Temporary no-auth route for buying center backfill.
// DELETE THIS CONTROLLER METHOD AND ROUTE AFTER BACKFILL IS COMPLETE.
const backfillBuyingCenters = async (req, res) => {
  try {
    const result = await syncService.backfillBuyingCenters();

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Buying center backfill failed:", error);
    return res.status(500).json({
      success: false,
      message: "Buying center backfill failed",
      error: error.message,
    });
  }
};

module.exports = {
  runSync,
  // backfillWeighbridgeTicketDetails,
  manualSyncCmsMasterDataFrom2026,
  backfillBuyingCenters,
};
