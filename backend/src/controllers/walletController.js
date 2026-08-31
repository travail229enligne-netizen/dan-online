const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Shop = require("../models/Shop");
const Withdrawal = require("../models/Withdrawal");

// @route   GET /api/wallet/me
// @access  Private (marchand) - solde et historique
const getMyWallet = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const deliveredOrders = await Order.find({ "items.shop": shop._id, status: "delivered" });
  let totalGagne = 0;
  deliveredOrders.forEach((order) => {
    order.items
      .filter((it) => it.shop.toString() === shop._id.toString())
      .forEach((it) => {
        totalGagne += it.price * it.quantity;
      });
  });
  const totalCommissionSurLivrees = deliveredOrders.reduce((sum, o) => sum + o.commissionAmount, 0);
  const revenuNetAcquis = totalGagne - totalCommissionSurLivrees;

  const pendingOrders = await Order.find({
    "items.shop": shop._id,
    status: { $in: ["pending", "confirmed", "out_for_delivery"] },
  });
  let totalEnAttente = 0;
  pendingOrders.forEach((order) => {
    order.items
      .filter((it) => it.shop.toString() === shop._id.toString())
      .forEach((it) => {
        totalEnAttente += it.price * it.quantity;
      });
  });

  const withdrawals = await Withdrawal.find({ shop: shop._id, type: "shop" }).sort({ createdAt: -1 });
  const totalRetire = withdrawals.filter((w) => w.status === "paid").reduce((sum, w) => sum + w.amount, 0);
  const totalEnCoursRetrait = withdrawals.filter((w) => w.status === "pending").reduce((sum, w) => sum + w.amount, 0);

  const soldeDisponible = revenuNetAcquis - totalRetire - totalEnCoursRetrait;

  res.json({
    soldeDisponible: Math.max(0, soldeDisponible),
    soldeEnAttente: totalEnAttente,
    totalGagne: revenuNetAcquis,
    withdrawals,
  });
});

// @route   POST /api/wallet/withdraw
// @access  Private (marchand) - demande de retrait
const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, phone } = req.body;
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  if (!amount || amount <= 0) return res.status(400).json({ message: "Montant invalide." });
  if (!phone) return res.status(400).json({ message: "Numéro Mobile Money requis." });

  const withdrawal = await Withdrawal.create({ type: "shop", shop: shop._id, amount, phone });
  res.status(201).json(withdrawal);
});

// @route   GET /api/wallet/courier/me
// @access  Private (tout compte ayant deja livre au moins une commande) - solde et historique du livreur
const getMyCourierWallet = asyncHandler(async (req, res) => {
  const deliveredOrders = await Order.find({ assignedCourier: req.user._id, status: "delivered" });
  const totalGagne = deliveredOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

  const pendingOrders = await Order.find({
    assignedCourier: req.user._id,
    status: { $in: ["confirmed", "out_for_delivery"] },
  });
  const totalEnAttente = pendingOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

  const withdrawals = await Withdrawal.find({ courier: req.user._id, type: "courier" }).sort({ createdAt: -1 });
  const totalRetire = withdrawals.filter((w) => w.status === "paid").reduce((sum, w) => sum + w.amount, 0);
  const totalEnCoursRetrait = withdrawals.filter((w) => w.status === "pending").reduce((sum, w) => sum + w.amount, 0);

  const soldeDisponible = totalGagne - totalRetire - totalEnCoursRetrait;

  res.json({
    soldeDisponible: Math.max(0, soldeDisponible),
    soldeEnAttente: totalEnAttente,
    totalGagne,
    withdrawals,
  });
});

// @route   POST /api/wallet/courier/withdraw
// @access  Private (livreur)
const requestCourierWithdrawal = asyncHandler(async (req, res) => {
  const { amount, phone } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: "Montant invalide." });
  if (!phone) return res.status(400).json({ message: "Numéro Mobile Money requis." });

  const withdrawal = await Withdrawal.create({ type: "courier", courier: req.user._id, amount, phone });
  res.status(201).json(withdrawal);
});

// @route   GET /api/admin/withdrawals
// @access  Private (admin) - liste des demandes de retrait en attente (marchands + livreurs)
const getAllWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await Withdrawal.find({ status: "pending", type: { $ne: "admin" } })
    .populate({ path: "shop", select: "name owner", populate: { path: "owner", select: "name phone" } })
    .populate("courier", "name phone")
    .sort({ createdAt: -1 });
  res.json(withdrawals);
});

// @route   PUT /api/admin/withdrawals/:id
// @access  Private (admin) - marque un retrait comme paye ou refuse
const processWithdrawal = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!["paid", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) return res.status(404).json({ message: "Demande introuvable." });

  withdrawal.status = status;
  withdrawal.note = note || "";
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  res.json(withdrawal);
});

// @route   GET /api/admin/commission-wallet
// @access  Private (admin) - solde des commissions de la plateforme
const getAdminCommissionWallet = asyncHandler(async (req, res) => {
  const deliveredOrders = await Order.find({ status: "delivered" });
  const totalCommission = deliveredOrders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);

  const withdrawals = await Withdrawal.find({ type: "admin" }).sort({ createdAt: -1 });
  const totalRetire = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  res.json({
    soldeDisponible: Math.max(0, totalCommission - totalRetire),
    totalCommission,
    withdrawals,
  });
});

// @route   POST /api/admin/commission-wallet/withdraw
// @access  Private (admin) - retrait auto-valide (c'est son propre argent)
const withdrawAdminCommission = asyncHandler(async (req, res) => {
  const { amount, phone } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: "Montant invalide." });
  if (!phone) return res.status(400).json({ message: "Numéro Mobile Money requis." });

  const withdrawal = await Withdrawal.create({
    type: "admin",
    amount,
    phone,
    status: "paid",
    processedAt: new Date(),
  });
  res.status(201).json(withdrawal);
});

module.exports = {
  getMyWallet,
  requestWithdrawal,
  getMyCourierWallet,
  requestCourierWithdrawal,
  getAllWithdrawals,
  processWithdrawal,
  getAdminCommissionWallet,
  withdrawAdminCommission,
};
