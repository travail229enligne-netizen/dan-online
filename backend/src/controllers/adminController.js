const asyncHandler = require("express-async-handler");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { notify } = require("../utils/notify");

// @route   GET /api/admin/shops/pending
// @access  Private (admin) - boutiques en attente de validation
const getPendingShops = asyncHandler(async (req, res) => {
  const shops = await Shop.find({ status: "pending" }).populate("owner", "name email phone");
  res.json(shops);
});

// @route   GET /api/admin/shops
// @access  Private (admin) - liste de toutes les boutiques, tous statuts
const getAllShops = asyncHandler(async (req, res) => {
  const shops = await Shop.find().populate("owner", "name email phone").sort({ createdAt: -1 });
  res.json(shops);
});

// @route   PUT /api/admin/shops/:id/validate
// @access  Private (admin) - valide un emplacement virtuel (boutique)
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

// @route   PUT /api/admin/shops/:id/suspend
// @access  Private (admin)
const suspendShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.params.id, { status: "suspended" }, { new: true });
  if (!shop) return res.status(404).json({ message: "Boutique introuvable." });
  res.json(shop);
});

// @route   DELETE /api/admin/shops/:id
// @access  Private (admin) - supprime definitivement une boutique (donnees test ou non-conformite)
const deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) return res.status(404).json({ message: "Boutique introuvable." });

  await Product.deleteMany({ shop: shop._id });
  await User.findByIdAndUpdate(shop.owner, { $unset: { shop: "" } });
  await shop.deleteOne();

  res.json({ message: "Boutique supprimee avec succes." });
});

// @route   GET /api/admin/dashboard
// @access  Private (admin) - vue d'ensemble de la plateforme
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

module.exports = { getPendingShops, getAllShops, validateShop, suspendShop, deleteShop, getDashboard };
