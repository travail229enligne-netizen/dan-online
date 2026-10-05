const express = require("express");
const { protect, optionalAuth } = require("../middleware/auth");
const { delegateToShopyz, getPendingDispatch } = require("../controllers/shopyzDeliveryController");

const router = express.Router();

router.get("/pending", protect, getPendingDispatch);
router.post("/:orderId/delegate", protect, delegateToShopyz);

module.exports = router;
