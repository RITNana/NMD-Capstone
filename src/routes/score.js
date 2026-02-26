const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/", (req, res) => {
  const filePath = path.join(__dirname, "..", "..", "sessions.json");

  try {
    if (!fs.existsSync(filePath)) {
      return res.json({});
    }
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    res.json(data);
  } catch (e) {
    console.error("Error reading sessions.json:", e);
    res.status(500).json({ error: "Failed to read sessions.json" });
  }
});

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
