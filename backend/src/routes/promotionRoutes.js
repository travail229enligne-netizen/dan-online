const express = require("express");
const {
  getMyPromotions,
  createPromotion,
  togglePromotion,
  deletePromotion,
  validateCode,
} = require("../controllers/promotionController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.get("/me", protect, authorize("marchand"), getMyPromotions);
router.post("/", protect, authorize("marchand"), createPromotion);
router.put("/:id/toggle", protect, authorize("marchand"), togglePromotion);
router.delete("/:id", protect, authorize("marchand"), deletePromotion);
router.post("/validate", protect, validateCode);

module.exports = router;
