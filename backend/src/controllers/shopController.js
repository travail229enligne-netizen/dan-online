const asyncHandler = require("express-async-handler");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");

function sanitizeZones(zones) {
  if (!Array.isArray(zones)) return [];
  return zones
    .filter((z) => z && z.city && z.city.trim() && z.price >= 0)
    .map((z) => ({ city: z.city.trim(), price: Number(z.price) }));
}

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

const getMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id }).populate("category", "name icon");
  res.json(shop || null);
});

const getShopById = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id).select("name slug deliveryZones businessType");
  if (!shop) return res.status(404).json({ message: "Boutique introuvable." });
  res.json(shop);
});

const getShopBySlug = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ slug: req.params.slug }).populate("category", "name icon").populate("owner", "phone");
  if (!shop) return res.status(404).json({ message: "Boutique introuvable." });
  res.json(shop);
});

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

const getMyShopStats = asyncHandler(async (req, res) => {
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

// @route   GET /api/shops/me/chart
// @access  Private (marchand) - evolution 30 jours + top produits + repartition statuts
const getMyShopChart = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });

  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const allOrders = await Order.find({ "items.shop": shop._id });

  // Evolution journaliere (30 jours), hors commandes annulees
  const days = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), commandes: 0, ventes: 0 });
  }
  const dayMap = Object.fromEntries(days.map((d) => [d.date, d]));

  allOrders
    .filter((o) => o.status !== "cancelled" && o.createdAt >= since)
    .forEach((order) => {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (!dayMap[key]) return;
      let lineTotal = 0;
      order.items
        .filter((it) => it.shop.toString() === shop._id.toString())
        .forEach((it) => {
          lineTotal += it.price * it.quantity;
        });
      dayMap[key].commandes += 1;
      dayMap[key].ventes += lineTotal;
    });

  // Repartition par statut (toutes periodes confondues)
  const statusCounts = { pending: 0, confirmed: 0, out_for_delivery: 0, delivered: 0, cancelled: 0 };
  allOrders.forEach((o) => {
    if (statusCounts[o.status] !== undefined) statusCounts[o.status] += 1;
  });

  // Top 5 produits les plus vendus (par quantite, commandes non annulees)
  const productSales = {};
  allOrders
    .filter((o) => o.status !== "cancelled")
    .forEach((order) => {
      order.items
        .filter((it) => it.shop.toString() === shop._id.toString())
        .forEach((it) => {
          const key = it.product.toString();
          if (!productSales[key]) productSales[key] = { name: it.name, quantite: 0, ventes: 0 };
          productSales[key].quantite += it.quantity;
          productSales[key].ventes += it.price * it.quantity;
        });
    });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 5);

  res.json({
    evolution: days,
    statusCounts,
    topProducts,
  });
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
  getMyShopChart,
};
