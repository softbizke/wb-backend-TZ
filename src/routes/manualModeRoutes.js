const express = require("express");
const router = express.Router();
const manualModeController = require("../controllers/manualModeController");
const authenticateToken = require("../middlewares/auth");

// Routes
router.post(
  "/request",
  authenticateToken.authenticateToken,
  manualModeController.requestManualMode
); // User requests manual mode
router.post(
  "/approve",
  authenticateToken.authenticateToken,
  manualModeController.approveManualMode
); // Admin approves a request
router.post(
  "/extend",
  authenticateToken.authenticateToken,
  manualModeController.extendManualMode
); // Admin extends a request
router.post(
  "/reject",
  authenticateToken.authenticateToken,
  manualModeController.rejectManualMode
); // Admin rejects a request
router.get(
  "/all",
  authenticateToken.authenticateToken,
  manualModeController.getAllManualModeRequests
); // Admin fetches all requests
router.get(
  "/status",
  authenticateToken.authenticateToken,
  manualModeController.currentUserMode
); // Check current user mode

router.post(
  "/capture",
  authenticateToken.authenticateToken,
  manualModeController.postManualModeLog
);
router.post(
  "/end",
  authenticateToken.authenticateToken,
  manualModeController.endManualModeSession
);
module.exports = router;
