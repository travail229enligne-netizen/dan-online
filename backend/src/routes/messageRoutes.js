const express = require("express");
const { getConversations, startConversation, startCourierConversation, getMessages, sendMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);
router.post("/start/:shopId", startConversation);
router.post("/start-courier", startCourierConversation);
router.get("/:conversationId", getMessages);
router.post("/:conversationId", sendMessage);

module.exports = router;
