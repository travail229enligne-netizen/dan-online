const express = require("express");
const {
  getPendingShops,
  getAllShops,
  validateShop,
  suspendShop,
  deleteShop,
  getDashboard,
} = require("../controllers/adminController");
const { getAllWithdrawals, processWithdrawal } = require("../controllers/walletController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/shops", getAllShops);
router.get("/shops/pending", getPendingShops);
router.put("/shops/:id/validate", validateShop);
router.put("/shops/:id/suspend", suspendShop);
router.delete("/shops/:id", deleteShop);
router.get("/withdrawals", getAllWithdrawals);
router.put("/withdrawals/:id", processWithdrawal);

module.exports = router;
