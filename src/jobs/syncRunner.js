const schedule = require("node-schedule");
const syncService = require("../services/syncService");


// Run immediately on startup
(async () => {
  await syncService.syncAll("Initial");
})();

// Run every hour (at minute 0)
schedule.scheduleJob("0 * * * *", async () => {
  await syncService.syncAll("Scheduled");
});
