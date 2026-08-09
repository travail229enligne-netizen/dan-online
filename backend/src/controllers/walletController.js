const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Shop = require("../models/Shop");
const Withdrawal = require("../models/Withdrawal");

// @route   GET /api/wallet/me
// @access  Private (marchand) - solde et historique
const getMyWallet = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  // Ventes livrees et payees (COD encaisse) = revenu acquis
  const deliveredOrders = await Order.find({ "items.shop": shop._id, status: "delivered" });
  let totalGagne = 0;
  deliveredOrders.forEach((order) => {
    order.items
      .filter((it) => it.shop.toString() === shop._id.toString())
      .forEach((it) => {
        totalGagne += it.price * it.quantity;
      });
  });
  // On retire la part commission (approx via commissionAmount proportionnel a la commande globale)
  const totalCommissionSurLivrees = deliveredOrders.reduce((sum, o) => sum + o.commissionAmount, 0);
  const revenuNetAcquis = totalGagne - totalCommissionSurLivrees;

  // Ventes en cours (confirmee/en livraison) = solde en attente
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

  const withdrawals = await Withdrawal.find({ shop: shop._id }).sort({ createdAt: -1 });
  const totalRetire = withdrawals
    .filter((w) => w.status === "paid")
    .reduce((sum, w) => sum + w.amount, 0);
  const totalEnCoursRetrait = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + w.amount, 0);

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

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Montant invalide." });
  }
  if (!phone) {
    return res.status(400).json({ message: "Numéro Mobile Money requis." });
  }

  const withdrawal = await Withdrawal.create({ shop: shop._id, amount, phone });
  res.status(201).json(withdrawal);
});

// @route   GET /api/admin/withdrawals
// @access  Private (admin) - liste des demandes de retrait en attente
const getAllWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await Withdrawal.find({ status: "pending" })
    .populate({ path: "shop", select: "name owner", populate: { path: "owner", select: "name phone" } })
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

module.exports = { getMyWallet, requestWithdrawal, getAllWithdrawals, processWithdrawal };
