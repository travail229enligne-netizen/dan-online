const asyncHandler = require("express-async-handler");
const Shop = require("../models/Shop");
const Product = require("../models/Product");
const { verifyTransaction } = require("../utils/kkiapay");

const SHOP_PRICE_PER_DAY = 1000;
const PRODUCT_PRICE_PER_DAY = 300;

// @route   GET /api/feature/price?target=shop|product&days=N
// @access  Private (marchand) - calcule le prix avant paiement
const getFeaturePrice = asyncHandler(async (req, res) => {
  const { target, days } = req.query;
  const nbDays = Number(days);
  if (!["shop", "product"].includes(target) || !nbDays || nbDays <= 0) {
    return res.status(400).json({ message: "Parametres invalides." });
  }
  const pricePerDay = target === "shop" ? SHOP_PRICE_PER_DAY : PRODUCT_PRICE_PER_DAY;
  res.json({ pricePerDay, days: nbDays, total: pricePerDay * nbDays });
});

// @route   POST /api/feature/shop
// @access  Private (marchand) - met en avant sa propre boutique apres paiement verifie
// body: { days, transactionId }
const featureMyShop = asyncHandler(async (req, res) => {
  const { days, transactionId } = req.body;
  const nbDays = Number(days);
  if (!nbDays || nbDays <= 0) return res.status(400).json({ message: "Duree invalide." });
  if (!transactionId) return res.status(400).json({ message: "Transaction de paiement manquante." });

  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });
  if (shop.status !== "active") {
    return res.status(403).json({ message: "Ta boutique doit etre active pour etre mise en avant." });
  }

  const expectedAmount = nbDays * SHOP_PRICE_PER_DAY;

  let payment;
  try {
    payment = await verifyTransaction(transactionId);
  } catch (err) {
    console.error("Kkiapay verify error (feature shop):", err.message, err.response?.data);
    return res.status(400).json({ message: "Impossible de verifier le paiement. Reessaie." });
  }

  const status = (payment?.status || payment?.transactionStatus || "").toString().toUpperCase();
  if (status !== "SUCCESS") {
    return res.status(400).json({ message: `Le paiement n'a pas ete confirme (statut: ${status || "inconnu"}).` });
  }

  const paidAmount = Number(payment?.amount || 0);
  if (paidAmount < expectedAmount) {
    return res.status(400).json({ message: "Le montant paye ne correspond pas au prix attendu." });
  }

  const now = new Date();
  const base = shop.featuredUntil && new Date(shop.featuredUntil) > now ? new Date(shop.featuredUntil) : now;
  base.setDate(base.getDate() + nbDays);
  shop.featuredUntil = base;
  await shop.save();

  res.json(shop);
});

// @route   POST /api/feature/product/:id
// @access  Private (marchand) - met en avant un de ses produits apres paiement verifie
// body: { days, transactionId }
const featureMyProduct = asyncHandler(async (req, res) => {
  const { days, transactionId } = req.body;
  const nbDays = Number(days);
  if (!nbDays || nbDays <= 0) return res.status(400).json({ message: "Duree invalide." });
  if (!transactionId) return res.status(400).json({ message: "Transaction de paiement manquante." });

  const product = await Product.findById(req.params.id).populate("shop");
  if (!product) return res.status(404).json({ message: "Produit introuvable." });
  if (product.shop.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Ce produit ne vous appartient pas." });
  }
  if (product.shop.status !== "active") {
    return res.status(403).json({ message: "Ta boutique doit etre active pour mettre en avant un produit." });
  }

  const expectedAmount = nbDays * PRODUCT_PRICE_PER_DAY;

  let payment;
  try {
    payment = await verifyTransaction(transactionId);
  } catch (err) {
    console.error("Kkiapay verify error (feature product):", err.message, err.response?.data);
    return res.status(400).json({ message: "Impossible de verifier le paiement. Reessaie." });
  }

  const status = (payment?.status || payment?.transactionStatus || "").toString().toUpperCase();
  if (status !== "SUCCESS") {
    return res.status(400).json({ message: `Le paiement n'a pas ete confirme (statut: ${status || "inconnu"}).` });
  }

  const paidAmount = Number(payment?.amount || 0);
  if (paidAmount < expectedAmount) {
    return res.status(400).json({ message: "Le montant paye ne correspond pas au prix attendu." });
  }

  const now = new Date();
  const base = product.featuredUntil && new Date(product.featuredUntil) > now ? new Date(product.featuredUntil) : now;
  base.setDate(base.getDate() + nbDays);
  product.featuredUntil = base;
  await product.save();

  res.json(product);
});

module.exports = { getFeaturePrice, featureMyShop, featureMyProduct, SHOP_PRICE_PER_DAY, PRODUCT_PRICE_PER_DAY };
