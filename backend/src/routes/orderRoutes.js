const express = require("express");
const {
  createOrder,
  getMyOrders,
  getPendingPaymentOrder,
  getShopOrders,
  getOrderById,
  payOrder,
  respondAsCourier,
  submitDeliveryProof,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.post("/", protect, authorize("client"), createOrder);
router.get("/mine", protect, authorize("client"), getMyOrders);
router.get("/pending-payment", protect, authorize("client"), getPendingPaymentOrder);
router.get("/shop", protect, authorize("marchand"), getShopOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/pay", protect, authorize("client"), payOrder);
router.put("/:id/courier-response", protect, respondAsCourier);
router.put("/:id/delivery-proof", protect, submitDeliveryProof);
router.put("/:id/status", protect, authorize("marchand", "admin"), updateOrderStatus);

module.exports = router;
