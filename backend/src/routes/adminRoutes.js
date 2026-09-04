const express = require("express");
const asyncHandler = require("express-async-handler");
const Shop = require("../models/Shop");
const Product = require("../models/Product");
const {
  getPendingShops,
  getAllShops,
  validateShop,
  suspendShop,
  deleteShop,
  getDashboard,
  getDashboardChart,
} = require("../controllers/adminController");
const {
  getAllWithdrawals,
  processWithdrawal,
  getAdminCommissionWallet,
  withdrawAdminCommission,
} = require("../controllers/walletController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/dashboard-chart", getDashboardChart);
router.get("/shops", getAllShops);
router.get("/shops/pending", getPendingShops);
router.put("/shops/:id/validate", validateShop);
router.put("/shops/:id/suspend", suspendShop);
router.delete("/shops/:id", deleteShop);
router.get("/withdrawals", getAllWithdrawals);
router.put("/withdrawals/:id", processWithdrawal);
router.get("/commission-wallet", getAdminCommissionWallet);
router.post("/commission-wallet/withdraw", withdrawAdminCommission);

router.put(
  "/shops/:id/professional",
  asyncHandler(async (req, res) => {
    const { isProfessional } = req.body;
    const shop = await Shop.findByIdAndUpdate(req.params.id, { isProfessional: !!isProfessional }, { new: true });
    if (!shop) return res.status(404).json({ message: "Boutique introuvable." });
    res.json(shop);
  })
);

router.put(
  "/shops/:id/feature",
  asyncHandler(async (req, res) => {
    const { days } = req.body;
    const featuredUntil = Number(days) > 0 ? new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000) : null;
    const shop = await Shop.findByIdAndUpdate(req.params.id, { featuredUntil }, { new: true });
    if (!shop) return res.status(404).json({ message: "Boutique introuvable." });
    res.json(shop);
  })
);

router.put(
  "/products/:id/feature",
  asyncHandler(async (req, res) => {
    const { days } = req.body;
    const featuredUntil = Number(days) > 0 ? new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000) : null;
    const product = await Product.findByIdAndUpdate(req.params.id, { featuredUntil }, { new: true });
    if (!product) return res.status(404).json({ message: "Produit introuvable." });
    res.json(product);
  })
);

module.exports = router;
