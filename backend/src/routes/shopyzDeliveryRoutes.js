const express = require("express");
const { protect, optionalAuth } = require("../middleware/auth");
const { delegateToShopyz, getPendingDispatch, dispatchToCouriers, getAvailableDispatch, claimDelivery, declineDelivery } = require("../controllers/shopyzDeliveryController");

const router = express.Router();

router.get("/pending", protect, getPendingDispatch);
router.post("/:orderId/delegate", protect, delegateToShopyz);
router.get("/available", protect, getAvailableDispatch);
router.post("/:orderId/dispatch", protect, dispatchToCouriers);
router.post("/:orderId/claim", protect, claimDelivery);
router.post("/:orderId/decline", protect, declineDelivery);

module.exports = router;
