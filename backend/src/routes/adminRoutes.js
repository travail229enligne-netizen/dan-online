const express = require("express");
const {
  getPendingShops,
  validateShop,
  suspendShop,
  deleteShop,
  getDashboard,
} = require("../controllers/adminController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/shops/pending", getPendingShops);
router.put("/shops/:id/validate", validateShop);
router.put("/shops/:id/suspend", suspendShop);
router.delete("/shops/:id", deleteShop);

module.exports = router;
