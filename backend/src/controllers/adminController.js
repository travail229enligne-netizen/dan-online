const asyncHandler = require("express-async-handler");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { notify } = require("../utils/notify");

const getPendingShops = asyncHandler(async (req, res) => {
  const shops = await Shop.find({ status: "pending" }).populate("owner", "name email phone");
  res.json(shops);
});

const getAllShops = asyncHandler(async (req, res) => {
  const shops = await Shop.find().populate("owner", "name email phone").sort({ createdAt: -1 });
  res.json(shops);
});

const validateShop = asyncHandler(async (req, res) => {
  const { approve, commissionRate, rentAmount } = req.body;
  const shop = await Shop.findById(req.params.id);
  if (!shop) return res.status(404).json({ message: "Boutique introuvable." });

  shop.status = approve ? "active" : "suspended";
  shop.isVerified = !!approve;
  if (commissionRate !== undefined) shop.commissionRate = commissionRate;
  if (rentAmount !== undefined) shop.rent.amount = rentAmount;

  await shop.save();

  await notify(
    shop.owner,
    approve ? "shop_validated" : "shop_rejected",
    approve ? "Boutique validée" : "Boutique refusée",
    approve
      ? `Ta boutique "${shop.name}" est maintenant active sur EasyShop.`
      : `Ta boutique "${shop.name}" n'a pas été validée. Contacte le support pour en savoir plus.`,
    "/marchand/boutique"
  );

  res.json(shop);
});

const suspendShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.params.id, { status: "suspended" }, { new: true });
  if (!shop) return res.status(404).json({ message: "Boutique introuvable." });
  res.json(shop);
});

const deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) return res.status(404).json({ message: "Boutique introuvable." });

  await Product.deleteMany({ shop: shop._id });
  await User.findByIdAndUpdate(shop.owner, { $unset: { shop: "" } });
  await shop.deleteOne();

  res.json({ message: "Boutique supprimee avec succes." });
});

const getDashboard = asyncHandler(async (req, res) => {
  const [totalMarchands, totalClients, activeShops, pendingShops, totalOrders] = await Promise.all([
    User.countDocuments({ role: "marchand" }),
    User.countDocuments({ role: "client" }),
    Shop.countDocuments({ status: "active" }),
    Shop.countDocuments({ status: "pending" }),
    Order.countDocuments(),
  ]);

  const orders = await Order.find({ status: { $ne: "cancelled" } });
  const totalCommission = orders.reduce((sum, o) => sum + o.commissionAmount, 0);
  const totalGMV = orders.reduce((sum, o) => sum + o.grandTotal, 0);

  res.json({
    totalMarchands,
    totalClients,
    activeShops,
    pendingShops,
    totalOrders,
    totalCommission,
    totalGMV,
  });
});

// @route   GET /api/admin/dashboard-chart
// @access  Private (admin) - evolution commandes + revenu sur 30 jours
const getDashboardChart = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const orders = await Order.find({
    createdAt: { $gte: since },
    status: { $ne: "cancelled" },
  }).select("createdAt grandTotal commissionAmount");

  const days = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), commandes: 0, commission: 0 });
  }
  const dayMap = Object.fromEntries(days.map((d) => [d.date, d]));

  orders.forEach((o) => {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (dayMap[key]) {
      dayMap[key].commandes += 1;
      dayMap[key].commission += o.commissionAmount || 0;
    }
  });

  res.json(days);
});

module.exports = { getPendingShops, getAllShops, validateShop, suspendShop, deleteShop, getDashboard, getDashboardChart };
