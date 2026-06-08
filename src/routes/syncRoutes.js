const express = require("express");
const router = express.Router();
const syncController = require("../controllers/syncController");
const authenticateToken = require("../middlewares/auth");

router.post(
  "/run/v1",
  authenticateToken.authenticateToken,
  syncController.runSync,
);

// One-time buying center refresh route.
// If uncommented, this runs the manual updater that fetches CMS buying centers
// changed since Jan 1, 2026 and updates existing local rows by cms_id.
// router.post(
//   "/buying-centers/manual-update-2026/v1",
//   syncController.manualUpdateBuyingCentersFrom2026,
// );

module.exports = router;
