const express = require("express");
const {
  getShops,
  getShopBySlug,
  createShop,
  updateMyShop,
  getMyShopStats,
} = require("../controllers/shopController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.get("/", getShops);
router.get("/me/stats", protect, authorize("marchand"), getMyShopStats);
router.get("/:slug", getShopBySlug);
router.post("/", protect, authorize("marchand"), createShop);
router.put("/me", protect, authorize("marchand"), updateMyShop);

module.exports = router;
