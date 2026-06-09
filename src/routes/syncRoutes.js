const express = require("express");
const router = express.Router();
const syncController = require("../controllers/syncController");
const authenticateToken = require("../middlewares/auth");

router.post(
  "/run/v1",
  authenticateToken.authenticateToken,
  syncController.runSync,
);

// Temporary no-auth route for one-time CMS WB ticket detail backfill.
// Uncomment with the controller and service method when another backfill is needed.
// router.post(
//   "/wb-tickets/backfill-details/v1",
//   syncController.backfillWeighbridgeTicketDetails,
// );

// One-time buying center refresh route.
// If uncommented, this runs the manual updater that fetches CMS buying centers
// changed since Jan 1, 2026 and updates existing local rows by cms_id.
// router.post(
//   "/buying-centers/manual-update-2026/v1",
//   syncController.manualUpdateBuyingCentersFrom2026,
// );

module.exports = router;
