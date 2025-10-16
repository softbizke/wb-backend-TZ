const axios = require('axios');
const plateService = require('../services/plateService');

// Function to capture snapshot
const getSnapshot = async (req, res) => {
  //const { ip, username, password } = req.body;
  const { activitypoint } = req.body;
  try {
    //const responseMessage = await takeSnapshot(ip, username, password);
    const responseMessage = await plateService.takeSnapshot(activitypoint);
    if (responseMessage) {
      res.json({ message: responseMessage });
    } else {
      res.status(500).json({ error: 'Snapshot failed' });
    }
  } catch (error) {
    console.error('Error in /snapshot endpoint:', error.message);
    res.status(500).json({ error: error.message });
  }
};

//controller to get snapshots from camera
const getANPRSnapshots = async (req, res) => {
  //const { ip, username, password } = req.body;
  const { activitypoint } = req.body;
  try {
    //const responseMessage = await takeSnapshot(ip, username, password);
    const responseMessage = await plateService.takeANPRSnapShot();
    if (responseMessage) {
      res.json({ urls: responseMessage });
    } else {
      res.status(500).json({ error: 'Snapshot failed' });
    }
  } catch (error) {
    console.error('Error in /snapshot endpoint:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSnapshot, getANPRSnapshots
};
