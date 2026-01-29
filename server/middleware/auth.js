const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) return res.status(401).json({ message: "Missing auth token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, username, iat, exp }
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
};
