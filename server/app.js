const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const connectDB = require("./config/authDB");
const User = require("./models/user");

const app = express();

app.use(express.json());

// connect mongo
connectDB();

// serve client
const publicPath = path.join(__dirname, "..", "client", "public");
const srcPath = path.join(__dirname, "..", "client", "src");

// Serve public files (html, images, etc.)
app.use(express.static(publicPath));

// Serve src assets at /src (css/js)
app.use("/src", express.static(srcPath));

app.get("/", (req, res) => {
  return res.sendFile(path.join(publicPath, "index.html"));
});

app.get("/ingredients", (req, res) => {
  return res.sendFile(path.join(publicPath, "ingredients.html"));
});


/**
 * REGISTER - create account
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Missing credentials" });

    const existing = await User.findOne({ username });
    if (existing)
      return res.status(409).json({ message: "Username already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashed });

    return res.status(201).json({ token: "dummy-token" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * LOGIN - validate existing account
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Missing credentials" });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    return res.json({ token: "dummy-token" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = app;
