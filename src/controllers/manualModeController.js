const manualMode = require("../services/manualModeService");

// User requests manual mode
module.exports.requestManualMode = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = req.user;

    const result = await manualMode.requestManualMode(user.id, reason);

    if (result.status) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in requestManualMode:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin approves manual mode
module.exports.approveManualMode = async (req, res) => {
  try {
    const { expires_at, id } = req.body;
    const result = await manualMode.approveManualMode(id, expires_at);

    if (result.status) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in approveManualMode:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin rejects manual mode
module.exports.rejectManualMode = async (req, res) => {
  try {
    const { id, reason } = req.body;
    const result = await manualMode.rejectManualMode(id, reason);

    if (result.status) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in rejectManualMode:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin gets all manual mode requests
module.exports.getAllManualModeRequests = async (req, res) => {
  try {
    const result = await manualMode.getAllManualModeRequests();

    if (result.status) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in getAllManualModeRequests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Check current user's manual mode status
module.exports.currentUserMode = async (req, res) => {
  try {
    const user = req.user;
    const result = await manualMode.isUserInManualMode(user.id);

    return res.status(200).json({
      success: result.status,
      message: result.message,
      data: result.data || null,
    });
  } catch (error) {
    console.error("Error in currentUserMode:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//manual log
module.exports.postManualModeLog = async (req, res) => {
  try {
    const { truck, camera_id } = req.body;
    console.log("MANUAL MODE:: P ->", truck, " WB -> ", camera_id);
    const result = await manualMode.postManualModeLog(truck, camera_id);
    return res.status(200).json({
      success: result.status,
      message: result.message,
      data: result.data || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports.extendManualMode = async (req, res) => {
  try {
    const { expires_at, id } = req.body;
    const result = await manualMode.extendManualMode(id, expires_at);

    if (result.status) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in extendManualMode:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports.endManualModeSession = async (req, res) => {
  try {
    const { id } = req.body;
    const result = await manualMode.endManualModeSession(id);

    if (result.status) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in endManualModeSession:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
