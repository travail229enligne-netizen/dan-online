const express = require("express");
const { getPublicKey, subscribe, unsubscribe, sendTest } = require("../controllers/pushController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/vapid-public-key", getPublicKey);
router.post("/subscribe", protect, subscribe);
router.post("/unsubscribe", protect, unsubscribe);
router.post("/test", protect, sendTest);

module.exports = router;
