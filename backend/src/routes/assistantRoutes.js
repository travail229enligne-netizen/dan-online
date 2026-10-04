const express = require("express");
const { handleChat } = require("../controllers/assistantController");

const router = express.Router();

router.post("/chat", handleChat);

module.exports = router;
