const express = require("express");
const { handleChat } = require("../controllers/assistantController");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/chat", optionalAuth, handleChat);

module.exports = router;
