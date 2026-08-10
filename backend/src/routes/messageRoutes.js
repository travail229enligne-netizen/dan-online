const express = require("express");
const { getConversations, startConversation, getMessages, sendMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);
router.post("/start/:shopId", startConversation);
router.get("/:conversationId", getMessages);
router.post("/:conversationId", sendMessage);

module.exports = router;
