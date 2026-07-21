const schedule = require("node-schedule");
const syncService = require("../services/syncService");


// Run immediately on startup
(async () => {
  await syncService.syncAll("Initial");
})();

// Run every minute
schedule.scheduleJob("* * * * *", async () => {
  await syncService.syncAll("Scheduled");
});
