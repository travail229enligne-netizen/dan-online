const asyncHandler = require("express-async-handler");
const Shop = require("../models/Shop");
const User = require("../models/User");

// @route  GET /api/shops
// @access Public — liste des boutiques partenaires vérifiées
const getShops = asyncHandler(async (req, res) => {
  const filter = { status: "active" };
  if (req.query.category) filter.category = req.query.category;

  const shops = await Shop.find(filter)
    .populate("category", "name icon")
    .sort({ isVerified: -1, rating: -1 });

  res.json(shops);
});

// @route  GET /api/shops/:slug
// @access Public
const getShopBySlug = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ slug: req.params.slug }).populate("category", "name icon");
  if (!shop) return res.status(404).json({ message: "Boutique introuvable." });
  res.json(shop);
});

// @route  POST /api/shops
// @access Private (marchand) — crée sa boutique / demande d'emplacement virtuel
const createShop = asyncHandler(async (req, res) => {
  if (req.user.shop) {
    return res.status(400).json({ message: "Vous possédez déjà une boutique." });
  }

  const { name, description, category, allee, numero } = req.body;
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const shop = await Shop.create({
    owner: req.user._id,
    name,
    slug: `${slug}-${Date.now().toString().slice(-4)}`,
    description,
    category,
    location: { allee, numero },
    status: "pending", // en attente de validation par l'admin
  });

  await User.findByIdAndUpdate(req.user._id, { shop: shop._id });

  res.status(201).json(shop);
});

// @route  PUT /api/shops/me
// @access Private (marchand) — met à jour sa propre boutique
const updateMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée à ce compte." });

  const fields = ["name", "description", "logoUrl", "category"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) shop[f] = req.body[f];
  });
  if (req.body.allee || req.body.numero) {
    shop.location.allee = req.body.allee ?? shop.location.allee;
    shop.location.numero = req.body.numero ?? shop.location.numero;
  }

  await shop.save();
  res.json(shop);
});

// @route  GET /api/shops/me/stats
// @access Private (marchand) — tableau de bord ventes/commissions
const getMyShopStats = asyncHandler(async (req, res) => {
  const Order = require("../models/Order");
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée à ce compte." });

  const orders = await Order.find({ "items.shop": shop._id, status: { $ne: "cancelled" } });

  let totalVentes = 0;
  let totalCommission = 0;
  let nbCommandes = orders.length;

  orders.forEach((order) => {
    order.items
      .filter((it) => it.shop.toString() === shop._id.toString())
      .forEach((it) => {
        const lineTotal = it.price * it.quantity;
        totalVentes += lineTotal;
        const rate = shop.commissionRate ?? Number(process.env.DEFAULT_COMMISSION_RATE || 10);
        totalCommission += (lineTotal * rate) / 100;
      });
  });

  res.json({
    shop: shop.name,
    nbCommandes,
    totalVentes,
    totalCommission,
    revenuNet: totalVentes - totalCommission,
  });
});

module.exports = { getShops, getShopBySlug, createShop, updateMyShop, getMyShopStats };
