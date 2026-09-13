const express = require("express");
const {
  getActiveFairs,
  getFairById,
  getMyFairs,
  createFair,
  inviteShop,
  respondInvite,
  updateMyEntries,
} = require("../controllers/fairController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.get("/", getActiveFairs);
router.get("/me", protect, authorize("marchand"), getMyFairs);
router.get("/:id", getFairById);
router.post("/", protect, authorize("marchand"), createFair);
router.post("/:id/invite", protect, authorize("marchand"), inviteShop);
router.put("/:id/respond", protect, authorize("marchand"), respondInvite);
router.put("/:id/products", protect, authorize("marchand"), updateMyEntries);

module.exports = router;
