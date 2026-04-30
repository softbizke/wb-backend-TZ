const schedule = require("node-schedule");
const syncService = require("../services/syncService");


// Run immediately on startup
(async () => {
  console.log("Initial sync...");
  await syncService.syncDrivers();
  await syncService.syncBuyingCenters();
  await syncService.syncWeighbridge();
})();

let isRunning = false;

// Run every hour (at minute 0)
schedule.scheduleJob("0 * * * *", async () => {
  console.log("Scheduled sync running...");

  if (isRunning) {
    console.log("Skipping sync, already running...");
    return;
  }

  isRunning = true;

  try {
    await syncService.syncDrivers();
    await syncService.syncBuyingCenters();
    await syncService.syncWeighbridge();
  } catch (error) {
    console.error("Scheduled sync error:", error.message);
  } finally {
    isRunning = false;
  }
});