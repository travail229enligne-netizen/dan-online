const asyncHandler = require("express-async-handler");
const Promotion = require("../models/Promotion");
const Shop = require("../models/Shop");
const mongoose = require("mongoose");

// @route   GET /api/promotions/me
// @access  Private (marchand)
const getMyPromotions = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const promotions = await Promotion.find({ shop: shop._id })
    .populate("products", "name price")
    .sort({ createdAt: -1 });
  res.json(promotions);
});

// @route   POST /api/promotions
// @access  Private (marchand)
const createPromotion = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const { code, type, value, appliesTo, products, startDate, endDate, usageLimit } = req.body;

  if (!code || !code.trim()) return res.status(400).json({ message: "Code requis." });
  if (!["percent", "fixed"].includes(type)) return res.status(400).json({ message: "Type de réduction invalide." });
  if (!value || value <= 0) return res.status(400).json({ message: "Valeur de réduction invalide." });
  if (type === "percent" && value > 100) return res.status(400).json({ message: "Un pourcentage ne peut pas dépasser 100." });
  if (appliesTo === "products" && (!products || products.length === 0)) {
    return res.status(400).json({ message: "Sélectionne au moins un produit." });
  }

  const existing = await Promotion.findOne({ shop: shop._id, code: code.trim().toUpperCase() });
  if (existing) return res.status(400).json({ message: "Ce code existe déjà pour ta boutique." });

  const promotion = await Promotion.create({
    shop: shop._id,
    code: code.trim().toUpperCase(),
    type,
    value,
    appliesTo: appliesTo === "products" ? "products" : "all",
    products: appliesTo === "products" ? products : [],
    startDate: startDate || null,
    endDate: endDate || null,
    usageLimit: usageLimit || null,
  });

  res.status(201).json(promotion);
});

// @route   PUT /api/promotions/:id/toggle
// @access  Private (marchand)
const togglePromotion = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const promotion = await Promotion.findOne({ _id: req.params.id, shop: shop._id });
  if (!promotion) return res.status(404).json({ message: "Code introuvable." });

  promotion.active = !promotion.active;
  await promotion.save();
  res.json(promotion);
});

// @route   DELETE /api/promotions/:id
// @access  Private (marchand)
const deletePromotion = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const promotion = await Promotion.findOneAndDelete({ _id: req.params.id, shop: shop._id });
  if (!promotion) return res.status(404).json({ message: "Code introuvable." });

  res.json({ message: "Code supprimé." });
});

// @route   POST /api/promotions/validate
// @access  Private (client) - verifie un code pour une boutique et une liste de produits du panier
const validateCode = asyncHandler(async (req, res) => {
  const { shopId, code, productIds } = req.body;
  if (!shopId || !code) return res.status(400).json({ message: "Boutique et code requis." });

  const promotion = await Promotion.findOne({ shop: shopId, code: code.trim().toUpperCase() });
  if (!promotion || !promotion.active) {
    return res.status(404).json({ message: "Code invalide." });
  }

  const now = new Date();
  if (promotion.startDate && now < promotion.startDate) {
    return res.status(400).json({ message: "Ce code n'est pas encore actif." });
  }
  if (promotion.endDate && now > promotion.endDate) {
    return res.status(400).json({ message: "Ce code a expiré." });
  }
  if (promotion.usageLimit && promotion.timesUsed >= promotion.usageLimit) {
    return res.status(400).json({ message: "Ce code a atteint sa limite d'utilisation." });
  }

  let eligibleProductIds = productIds || [];
  if (promotion.appliesTo === "products") {
    const allowed = new Set(promotion.products.map((p) => p.toString()));
    eligibleProductIds = eligibleProductIds.filter((id) => allowed.has(id));
    if (eligibleProductIds.length === 0) {
      return res.status(400).json({ message: "Ce code ne s'applique à aucun produit de ton panier." });
    }
  }

  res.json({
    code: promotion.code,
    type: promotion.type,
    value: promotion.value,
    appliesTo: promotion.appliesTo,
    eligibleProductIds,
  });
});

// @route   GET /api/promotions
// @access  Public - liste des codes actifs et valides actuellement, toutes boutiques confondues
const getActivePromotions = asyncHandler(async (req, res) => {
  const now = new Date();
  const promotions = await Promotion.find({
    active: true,
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ],
  })
    .populate("shop", "name slug logoUrl")
    .populate("products", "name")
    .sort({ createdAt: -1 });

  const filtered = promotions.filter((p) => !p.usageLimit || p.timesUsed < p.usageLimit);
  res.json(filtered);
});

module.exports = {

  getMyPromotions,
  createPromotion,
  togglePromotion,
  deletePromotion,
  validateCode,
  getActivePromotions,
};
