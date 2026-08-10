const express = require("express");
const asyncHandler = require("express-async-handler");
const Shop = require("../models/Shop");
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

// @route   PUT /api/admin/shops/:id/professional
// @access  Private (admin) - accorde ou retire le badge "Boutique professionnelle"
router.put(
  "/shops/:id/professional",
  asyncHandler(async (req, res) => {
    const { isProfessional } = req.body;
    const shop = await Shop.findByIdAndUpdate(req.params.id, { isProfessional: !!isProfessional }, { new: true });
    if (!shop) return res.status(404).json({ message: "Boutique introuvable." });
    res.json(shop);
  })
);

module.exports = router;
