const express = require("express");
const router = express.Router();
const syncController = require("../controllers/syncController");
const authenticateToken = require("../middlewares/auth");

router.post(
  "/run/v1",
  authenticateToken.authenticateToken,
  syncController.runSync,
);

module.exports = router;
