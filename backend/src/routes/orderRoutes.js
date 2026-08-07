const express = require("express");
const {
  createOrder,
  getMyOrders,
  getShopOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.post("/", protect, authorize("client"), createOrder);
router.get("/mine", protect, authorize("client"), getMyOrders);
router.get("/shop", protect, authorize("marchand"), getShopOrders);
router.put("/:id/status", protect, authorize("marchand", "admin"), updateOrderStatus);

module.exports = router;
