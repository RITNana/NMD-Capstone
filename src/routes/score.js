const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.post("/", (req, res) => {
  const { sessionId, key, value } = req.body;

  const filePath = path.join(__dirname, "..", "..", "sessions.json");

  let data = {};

  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  if (!data[sessionId]) {
    data[sessionId] = {};
  }

  data[sessionId][key] = value;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log("Score updated:", sessionId, key, value);

  res.json({ success: true });
});

module.exports = router;
