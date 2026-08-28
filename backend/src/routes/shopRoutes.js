const express = require("express");
const {
  getShops,
  getMyShop,
  getShopById,
  getShopBySlug,
  createShop,
  updateMyShop,
  closeMyShop,
  reopenMyShop,
  getMyShopStats,
  getMyCouriers,
  addCourier,
  removeCourier,
} = require("../controllers/shopController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.get("/", getShops);
router.get("/me", protect, authorize("marchand"), getMyShop);
router.get("/me/stats", protect, authorize("marchand"), getMyShopStats);
router.put("/me/close", protect, authorize("marchand"), closeMyShop);
router.put("/me/reopen", protect, authorize("marchand"), reopenMyShop);
router.get("/me/couriers", protect, authorize("marchand"), getMyCouriers);
router.post("/me/couriers", protect, authorize("marchand"), addCourier);
router.delete("/me/couriers/:userId", protect, authorize("marchand"), removeCourier);
router.get("/by-id/:id", getShopById);
router.get("/:slug", getShopBySlug);
router.post("/", protect, authorize("marchand"), createShop);
router.put("/me", protect, authorize("marchand"), updateMyShop);

module.exports = router;
