const express = require("express");
const { getShopReviews, createReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.get("/shop/:shopId", getShopReviews);
router.post("/", protect, authorize("client"), createReview);

module.exports = router;
