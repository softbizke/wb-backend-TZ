const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "1919728",
  key: "0e6665c3e6b36e671b88",
  secret: "fee26e10765d3c11a304",
  cluster: "ap2",
  useTLS: true
});

module.exports = pusher;
