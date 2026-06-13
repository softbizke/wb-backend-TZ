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

// router.post(
//   "/manual-cms-master-data-2026/v1",
//   syncController.manualSyncCmsMasterDataFrom2026,
// );

// Temporary no-auth route for buying center backfill.
// DELETE THIS ROUTE AFTER BACKFILL IS COMPLETE.
// router.post(
//   "/backfill-buying-centers/v1",
//   syncController.backfillBuyingCenters,
// );

module.exports = router;
