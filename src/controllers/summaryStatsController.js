const {
  getOrderTypeSummary,
  getProductsSummary,
} = require("../services/summaryStatsService");
const { formatDate } = require("../utils/functions");
const {
  getAllCameras,
  getAllActivityPoint,
} = require("../services/activitiesService");
const net = require("net");
// Get Order Type Summary
const fetchOrderTypeSummary = async (req, res) => {
  const { startDate, endDate } = req.query;

  // Validate date inputs
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "startDate and endDate query parameters are required",
    });
  }

  try {
    const summary = await getOrderTypeSummary(
      new Date(startDate).toLocaleString("en-US", {
        timeZone: "Africa/Nairobi",
      }),
      new Date(endDate).toLocaleString("en-US", { timeZone: "Africa/Nairobi" })
    );
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching Order Type Summary:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Products Summary
const fetchProductsSummary = async (req, res) => {
  const { startDate, endDate, orderType } = req.query;

  // Validate date inputs
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "startDate and endDate query parameters are required",
    });
  }

  try {
    const summary = await getProductsSummary(
      new Date(startDate).toLocaleString("en-US", {
        timeZone: "Africa/Nairobi",
      }),
      new Date(endDate).toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
      orderType || null
    );

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching Products Summary:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const fetchDevicesStatus = async (req, res) => {
  try {
    let cameras = await getAllCameras();
    let weighBridges = await getAllActivityPoint("");

    cameras = cameras.filter((camera) => camera.status === "active");
    weighBridges = weighBridges.filter((bridge) => bridge.isactive);
    const devices = [...cameras, ...weighBridges];

    console.log("Devices to check:", devices);
    // Check status of each device
    const results = await Promise.all(
      devices.map(async (device) => ({
        name: device.name || device.model || "Unknown Device",
        ip: device.address || device.ip_address,
        port: 4660,
        online: (await device.model)
          ? testCameraConnection(device.ip_address, "", "")
          : checkDevice(device.address || device.ip_address, 4660),
        last_check: Date.now(),
      }))
    );

    res.status(200).json({ success: true, data: results, devices: devices });
  } catch (error) {
    console.error("Error fetching Devices Status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }

  async function testCameraConnection(ip, username, password) {
    try {
      const url = `http://${ip}/cgi-bin/snapshot.cgi?channel=1&type=0`;
      const response = await axios.head(url, {
        auth: { username, password },
        timeout: 2000,
        validateStatus: () => true, // prevent throwing on 401/403
      });

      // If we get 200, 401 (unauthorized), etc → camera is reachable
      return response.status < 500;
    } catch (err) {
      return false;
    }
  }

  function checkDevice(ip, port, timeout = 2000) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let isOnline = false;

      socket.setTimeout(timeout);

      socket.on("connect", () => {
        isOnline = true;
        socket.destroy();
      });

      socket.on("timeout", () => {
        socket.destroy();
      });

      socket.on("error", () => {
        socket.destroy();
      });

      socket.on("close", () => {
        resolve(isOnline);
      });

      socket.connect(port, ip);
    });
  }
};

module.exports = {
  fetchOrderTypeSummary,
  fetchProductsSummary,
  fetchDevicesStatus,
};
