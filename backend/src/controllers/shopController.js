const asyncHandler = require("express-async-handler");
const Shop = require("../models/Shop");
const User = require("../models/User");

function sanitizeZones(zones) {
  if (!Array.isArray(zones)) return [];
  return zones
    .filter((z) => z && z.city && z.city.trim() && z.price >= 0)
    .map((z) => ({ city: z.city.trim(), price: Number(z.price) }));
}

// @route   GET /api/shops
// @access  Public - liste des boutiques partenaires verifiees
const getShops = asyncHandler(async (req, res) => {
  const filter = { status: "active" };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.city) filter.city = req.query.city;
  if (req.query.search && req.query.search.trim()) filter.name = { $regex: req.query.search.trim(), $options: "i" };

  const shops = await Shop.find(filter)
    .populate("category", "name icon")
    .sort({ featuredUntil: -1, isVerified: -1, rating: -1 });

  res.json(shops);
});

// @route   GET /api/shops/me
// @access  Private (marchand) - recupere sa propre boutique (ou null)
const getMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id }).populate("category", "name icon");
  res.json(shop || null);
});

// @route   GET /api/shops/by-id/:id
// @access  Public - utilise notamment pour calculer les frais de livraison au checkout
const getShopById = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id).select("name slug deliveryZones businessType");
  if (!shop) return res.status(404).json({ message: "Boutique introuvable." });
  res.json(shop);
});

// @route   GET /api/shops/:slug
// @access  Public
const getShopBySlug = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ slug: req.params.slug }).populate("category", "name icon").populate("owner", "phone");
  if (!shop) return res.status(404).json({ message: "Boutique introuvable." });
  res.json(shop);
});

// @route   POST /api/shops
// @access  Private (marchand) - cree sa boutique / demande d'emplacement virtuel
const createShop = asyncHandler(async (req, res) => {
  if (req.user.shop) {
    return res.status(400).json({ message: "Vous possedez deja une boutique." });
  }

  const { name, description, category, businessType, city, allee, numero, themeColor, deliveryZones } = req.body;
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const validBusinessTypes = ["boutique", "restaurant", "supermarche", "grossiste", "artisan"];

  const shop = await Shop.create({
    owner: req.user._id,
    name,
    slug: `${slug}-${Date.now().toString().slice(-4)}`,
    description,
    category,
    businessType: validBusinessTypes.includes(businessType) ? businessType : "boutique",
    city,
    location: { allee, numero },
    deliveryZones: sanitizeZones(deliveryZones),
    themeColor: themeColor || "#111111",
    status: "pending",
  });

  await User.findByIdAndUpdate(req.user._id, { shop: shop._id });

  res.status(201).json(shop);
});

// @route   PUT /api/shops/me
// @access  Private (marchand) - met a jour sa propre boutique
const updateMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });

  const validBusinessTypes = ["boutique", "restaurant", "supermarche", "grossiste", "artisan"];
  const fields = ["name", "description", "logoUrl", "category", "themeColor", "city"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) shop[f] = req.body[f];
  });

  if (req.body.businessType !== undefined && validBusinessTypes.includes(req.body.businessType)) {
    shop.businessType = req.body.businessType;
  }

  if (req.body.deliveryZones !== undefined) {
    shop.deliveryZones = sanitizeZones(req.body.deliveryZones);
  }

  if (req.body.allee !== undefined || req.body.numero !== undefined) {
    shop.location.allee = req.body.allee ?? shop.location.allee;
    shop.location.numero = req.body.numero ?? shop.location.numero;
  }

  await shop.save();
  res.json(shop);
});

// @route   PUT /api/shops/me/close
// @access  Private (marchand)
const closeMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });
  if (shop.status !== "active") {
    return res.status(400).json({ message: "Seule une boutique active peut etre fermee." });
  }

  shop.status = "closed";
  await shop.save();
  res.json(shop);
});

// @route   PUT /api/shops/me/reopen
// @access  Private (marchand)
const reopenMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });
  if (shop.status !== "closed") {
    return res.status(400).json({ message: "Seule une boutique fermee peut etre rouverte." });
  }

  shop.status = "active";
  await shop.save();
  res.json(shop);
});

// @route   GET /api/shops/me/stats
// @access  Private (marchand)
const getMyShopStats = asyncHandler(async (req, res) => {
  const Order = require("../models/Order");
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });

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

// @route   GET /api/shops/me/couriers
// @access  Private (marchand)
const getMyCouriers = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });
  res.json(shop.couriers);
});

// @route   POST /api/shops/me/couriers
// @access  Private (marchand)
const addCourier = asyncHandler(async (req, res) => {
  const { phone, name } = req.body;
  if (!phone || !phone.trim()) {
    return res.status(400).json({ message: "Numero de telephone requis." });
  }

  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });

  const courierUser = await User.findOne({ phone: phone.trim() });
  if (!courierUser) {
    return res.status(404).json({ message: "Aucun compte EasyShop n'est associe a ce numero. Le livreur doit d'abord creer un compte." });
  }

  const alreadyAdded = shop.couriers.some((c) => c.user.toString() === courierUser._id.toString());
  if (alreadyAdded) {
    return res.status(400).json({ message: "Ce livreur est deja dans ta liste." });
  }

  shop.couriers.push({
    user: courierUser._id,
    name: name && name.trim() ? name.trim() : courierUser.name,
    phone: phone.trim(),
  });
  await shop.save();

  res.status(201).json(shop.couriers);
});

// @route   DELETE /api/shops/me/couriers/:userId
// @access  Private (marchand)
const removeCourier = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });

  shop.couriers = shop.couriers.filter((c) => c.user.toString() !== req.params.userId);
  await shop.save();

  res.json(shop.couriers);
});

module.exports = {
  getShops,
  getMyShop,
  getShopById,
  getShopBySlug,
  createShop,
  updateMyShop,
  closeMyShop,
  reopenMyShop,
  getMyShopStats,
  getMyCouriers,
  addCourier,
  removeCourier,
};
