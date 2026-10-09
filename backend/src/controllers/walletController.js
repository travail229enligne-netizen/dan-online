const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Shop = require("../models/Shop");
const Withdrawal = require("../models/Withdrawal");
const { tryAutoPayout } = require("../services/autoPayout");

// Delai de securite (heures) entre le paiement du client et la disponibilite des fonds
const HOLD_HOURS = Number(process.env.WITHDRAW_HOLD_HOURS || 0);
const holdCutoff = () => new Date(Date.now() - HOLD_HOURS * 3600 * 1000);
const isMature = (o) => o.paymentStatus === "paid" && (!o.paidAt || new Date(o.paidAt) <= holdCutoff());

const parseAmount = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// Part brute d'une commande revenant a une boutique, et commission correspondante
const shopShare = (order, shopId) => {
  const mine = (order.items || []).filter((it) => it.shop.toString() === shopId.toString());
  const gross = mine.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const total = Number(order.itemsTotal) || gross;
  const ratio = total > 0 ? Math.min(1, gross / total) : 1;
  return { gross, commission: (order.commissionAmount || 0) * ratio };
};

async function shopBalance(shopId) {
  const orders = await Order.find({ "items.shop": shopId, status: { $ne: "cancelled" } });
  let earned = 0;
  let pendingAmount = 0;
  for (const o of orders) {
    const { gross, commission } = shopShare(o, shopId);
    if (isMature(o)) earned += gross - commission;
    else pendingAmount += gross;
  }
  const withdrawals = await Withdrawal.find({ shop: shopId, type: "shop" }).sort({ createdAt: -1 });
  const paid = withdrawals.filter((w) => w.status === "paid").reduce((sum, w) => sum + w.amount, 0);
  const inProgress = withdrawals.filter((w) => ["pending", "processing"].includes(w.status)).reduce((sum, w) => sum + w.amount, 0);
  return { earned, pendingAmount, withdrawals, available: earned - paid - inProgress };
}

async function courierBalance(userId) {
  const orders = await Order.find({ assignedCourier: userId, status: { $ne: "cancelled" } });
  let earned = 0;
  let pendingAmount = 0;
  for (const o of orders) {
    const fee = o.deliveryFee || 0;
    if (isMature(o)) earned += fee;
    else pendingAmount += fee;
  }
  const withdrawals = await Withdrawal.find({ courier: userId, type: "courier" }).sort({ createdAt: -1 });
  const paid = withdrawals.filter((w) => w.status === "paid").reduce((sum, w) => sum + w.amount, 0);
  const inProgress = withdrawals.filter((w) => ["pending", "processing"].includes(w.status)).reduce((sum, w) => sum + w.amount, 0);
  return { earned, pendingAmount, withdrawals, available: earned - paid - inProgress };
}

// @route   GET /api/wallet/me
// @access  Private (marchand) - solde et historique
const getMyWallet = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const b = await shopBalance(shop._id);
  res.json({
    soldeDisponible: Math.max(0, b.available),
    soldeEnAttente: b.pendingAmount,
    totalGagne: b.earned,
    withdrawals: b.withdrawals,
  });
});

// @route   POST /api/wallet/withdraw
// @access  Private (marchand) - demande de retrait (refusee si superieure au solde)
const requestWithdrawal = asyncHandler(async (req, res) => {
  const amount = parseAmount(req.body.amount);
  const phone = String(req.body.phone || "").trim();
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  if (!amount) return res.status(400).json({ message: "Montant invalide." });
  if (!phone) return res.status(400).json({ message: "Numéro Mobile Money requis." });

  const before = await shopBalance(shop._id);
  if (amount > before.available) {
    return res.status(400).json({ message: "Le montant dépasse ton solde disponible." });
  }

  const withdrawal = await Withdrawal.create({ type: "shop", shop: shop._id, amount, phone });
  const after = await shopBalance(shop._id);
  if (after.available < 0) {
    await Withdrawal.deleteOne({ _id: withdrawal._id });
    return res.status(400).json({ message: "Solde insuffisant. Réessaie dans un instant." });
  }
  res.status(201).json(await tryAutoPayout(withdrawal));
});

// @route   GET /api/wallet/courier/me
// @access  Private (livreur) - solde et historique du livreur
const getMyCourierWallet = asyncHandler(async (req, res) => {
  const b = await courierBalance(req.user._id);
  res.json({
    soldeDisponible: Math.max(0, b.available),
    soldeEnAttente: b.pendingAmount,
    totalGagne: b.earned,
    withdrawals: b.withdrawals,
  });
});

// @route   POST /api/wallet/courier/withdraw
// @access  Private (livreur)
const requestCourierWithdrawal = asyncHandler(async (req, res) => {
  const amount = parseAmount(req.body.amount);
  const phone = String(req.body.phone || "").trim();
  if (!amount) return res.status(400).json({ message: "Montant invalide." });
  if (!phone) return res.status(400).json({ message: "Numéro Mobile Money requis." });

  const before = await courierBalance(req.user._id);
  if (amount > before.available) {
    return res.status(400).json({ message: "Le montant dépasse ton solde disponible." });
  }

  const withdrawal = await Withdrawal.create({ type: "courier", courier: req.user._id, amount, phone });
  const after = await courierBalance(req.user._id);
  if (after.available < 0) {
    await Withdrawal.deleteOne({ _id: withdrawal._id });
    return res.status(400).json({ message: "Solde insuffisant. Réessaie dans un instant." });
  }
  res.status(201).json(await tryAutoPayout(withdrawal));
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
  if (withdrawal.status !== "pending") {
    return res.status(400).json({ message: "Cette demande a déjà été traitée." });
  }

  withdrawal.status = status;
  withdrawal.note = note || "";
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  res.json(withdrawal);
});

// @route   GET /api/admin/commission-wallet
// @access  Private (admin) - solde des commissions de la plateforme
const getAdminCommissionWallet = asyncHandler(async (req, res) => {
  const deliveredOrders = await Order.find({ status: "delivered", paymentStatus: "paid" });
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
