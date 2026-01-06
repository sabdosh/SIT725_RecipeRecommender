const express = require("express");
const path = require("path");

const app = express();

const clientPath = path.join(__dirname, "..", "client");
app.use(express.static(clientPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(clientPath, "public", "index.html"));
});

module.exports = app;
