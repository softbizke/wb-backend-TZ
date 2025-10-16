const jwt = require("jsonwebtoken");
const { secretKey } = require('../config/configs'); // Create a config file to store your secret key

function authenticateToken(req, res, next) {
  const _token = req.headers["authorization"];

  if (!_token) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = _token.split(" ")[1];
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

module.exports = {
    authenticateToken
  };
  