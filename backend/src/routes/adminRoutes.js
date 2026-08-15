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

router.put(
  "/shops/:id/professional",
  asyncHandler(async (req, res) => {
    const { isProfessional } = req.body;
    const shop = await Shop.findByIdAndUpdate(req.params.id, { isProfessional: !!isProfessional }, { new: true });
    if (!shop) return res.status(404).json({ message: "Boutique introuvable." });
    res.json(shop);
  })
);

// @route   PUT /api/admin/shops/:id/feature
// @access  Private (admin) - met en avant une boutique pour N jours (0 = retirer)
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

// @route   PUT /api/admin/products/:id/feature
// @access  Private (admin) - met en avant un produit pour N jours (0 = retirer)
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
