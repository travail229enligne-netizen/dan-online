const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Shop = require("../models/Shop");
const User = require("../models/User");
const notifyMod = require("../utils/notify");
const notify = notifyMod.notify || notifyMod;
const PlatformCourier = require("../models/PlatformCourier");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// @route   POST /api/shopyz-delivery/:orderId/delegate
// @access  Private (marchand) - confie la livraison a Shopyz, l'admin est notifie
const delegateToShopyz = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });

  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: "Commande introuvable." });

  const isMine = order.items.some((it) => it.shop.toString() === shop._id.toString());
  if (!isMine) return res.status(403).json({ message: "Cette commande ne concerne pas ta boutique." });

  if ((order.shopyzDelivery || "none") !== "none") {
    return res.status(400).json({ message: "Cette commande a déjà été confiée à Shopyz." });
  }
  if (order.assignedCourier && order.courierStatus !== "unavailable") {
    return res.status(400).json({ message: "Cette commande est déjà confiée à un livreur." });
  }

  order.shopyzDelivery = "awaiting_dispatch";
  order.shopyzDelegatedBy = shop._id;
  order.shopyzDelegatedAt = new Date();
  order.assignedCourier = null;
  order.courierStatus = "none";
  await order.save();

  try {
    const admins = await User.find({ role: "admin" }).select("_id");
    const ref = order._id.toString().slice(-6).toUpperCase();
    await Promise.all(
      admins.map((a) =>
        notify(a._id, "message", "Livraison confiée à Shopyz", `${shop.name} confie la commande #${ref} à Shopyz. Déploie les livreurs.`, "/admin/dashboard?section=livraisons")
      )
    );
  } catch (e) {
    // la commande reste confiee meme si la notification echoue
  }

  res.json({ ok: true });
});

// @route   GET /api/shopyz-delivery/pending
// @access  Private (admin)
const getPendingDispatch = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès réservé aux administrateurs." });
  const orders = await Order.find({ $or: [{ shopyzDelivery: "awaiting_dispatch" }, { shopyzDelivery: "dispatched", assignedCourier: null }] })
    .populate("shopyzDelegatedBy", "name")
    .sort({ shopyzDelegatedAt: -1 });
  res.json(orders);
});

const isPlatformCourier = async (userId) => !!(await PlatformCourier.findOne({ user: userId }));

// @route   POST /api/shopyz-delivery/:orderId/dispatch
// @access  Private (admin) - envoie la livraison a tous les livreurs Shopyz
const dispatchToCouriers = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès réservé aux administrateurs." });
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: "Commande introuvable." });
  if (!["awaiting_dispatch", "dispatched"].includes(order.shopyzDelivery || "none")) {
    return res.status(400).json({ message: "Cette commande n'a pas été confiée à Shopyz." });
  }
  if (order.assignedCourier) {
    return res.status(400).json({ message: "Cette livraison a déjà été prise par un livreur." });
  }
  const couriers = await PlatformCourier.find();
  if (couriers.length === 0) {
    return res.status(400).json({ message: "Aucun livreur Shopyz enregistré. Ajoute-en dans « Livreurs Shopyz »." });
  }
  order.shopyzDelivery = "dispatched";
  order.shopyzDispatchedAt = new Date();
  order.shopyzDeclinedBy = [];
  await order.save();

  const ref = order._id.toString().slice(-6).toUpperCase();
  await Promise.all(
    couriers.map((c) =>
      notify(c.user, "message", "🚚 Nouvelle livraison disponible", `Commande #${ref} : le premier livreur disponible la prend.`, "/livreur/livraisons")
    )
  );
  res.json({ ok: true, notified: couriers.length });
});

// @route   GET /api/shopyz-delivery/available
// @access  Private (livreur Shopyz) - sans adresse ni telephone du client
const getAvailableDispatch = asyncHandler(async (req, res) => {
  if (!(await isPlatformCourier(req.user._id))) {
    return res.status(403).json({ message: "Réservé aux livreurs Shopyz." });
  }
  const orders = await Order.find({
    shopyzDelivery: "dispatched",
    assignedCourier: null,
    shopyzDeclinedBy: { $ne: req.user._id },
  })
    .select("items.name items.quantity grandTotal deliveryCity shopyzDelegatedBy shopyzDispatchedAt")
    .populate("shopyzDelegatedBy", "name")
    .sort({ shopyzDispatchedAt: -1 });
  res.json(orders);
});

// @route   POST /api/shopyz-delivery/:orderId/claim
// @access  Private (livreur Shopyz) - le premier arrive prend la livraison
const claimDelivery = asyncHandler(async (req, res) => {
  if (!(await isPlatformCourier(req.user._id))) {
    return res.status(403).json({ message: "Réservé aux livreurs Shopyz." });
  }
  // Operation atomique : si deux livreurs appuient en meme temps, un seul passe
  const order = await Order.findOneAndUpdate(
    { _id: req.params.orderId, shopyzDelivery: "dispatched", assignedCourier: null },
    { $set: { assignedCourier: req.user._id, courierStatus: "available", status: "out_for_delivery" } },
    { new: true }
  ).populate("items.shop");
  if (!order) {
    return res.status(409).json({ message: "Cette livraison vient d'être prise par un autre livreur." });
  }

  let conversationId = null;
  const shop = order.shopyzDelegatedBy ? await Shop.findById(order.shopyzDelegatedBy) : null;
  if (shop) {
    let conversation = await Conversation.findOne({ type: "shop_courier", shop: shop._id, courier: req.user._id });
    if (!conversation) {
      conversation = await Conversation.create({ type: "shop_courier", shop: shop._id, courier: req.user._id, order: order._id });
    }
    conversation.order = order._id;
    await Message.create({
      conversation: conversation._id,
      sender: shop.owner,
      senderRole: "marchand",
      kind: "order_summary",
      order: order._id,
      text: "",
    });
    conversation.lastMessage = "📦 Livraison Shopyz : commande à livrer";
    conversation.lastMessageAt = new Date();
    conversation.unreadForClient += 1;
    conversation.unreadForMerchant += 1;
    await conversation.save();
    conversationId = conversation._id;
  }

  const owners = [...new Set(order.items.map((it) => it.shop?.owner?.toString()).filter(Boolean))];
  for (const ownerId of owners) {
    await notify(
      ownerId,
      "order_status",
      "Livreur Shopyz disponible",
      "Un livreur Shopyz a pris ta livraison. La commande est en cours de livraison.",
      conversationId ? `/messages/c/${conversationId}` : "/marchand/commandes"
    );
  }
  await notify(
    order.client,
    "order_status",
    "Votre commande est en route",
    "Un livreur a été assigné et votre commande est maintenant en cours de livraison.",
    "/commandes"
  );

  res.json({ ok: true, conversationId });
});

// @route   POST /api/shopyz-delivery/:orderId/decline
// @access  Private (livreur Shopyz)
const declineDelivery = asyncHandler(async (req, res) => {
  if (!(await isPlatformCourier(req.user._id))) {
    return res.status(403).json({ message: "Réservé aux livreurs Shopyz." });
  }
  const order = await Order.findOneAndUpdate(
    { _id: req.params.orderId, shopyzDelivery: "dispatched", assignedCourier: null },
    { $addToSet: { shopyzDeclinedBy: req.user._id } },
    { new: true }
  );
  if (!order) return res.json({ ok: true });

  const total = await PlatformCourier.countDocuments();
  if (order.shopyzDeclinedBy.length >= total) {
    try {
      const admins = await User.find({ role: "admin" }).select("_id");
      const ref = order._id.toString().slice(-6).toUpperCase();
      await Promise.all(
        admins.map((a) =>
          notify(a._id, "message", "Aucun livreur disponible", `Tous les livreurs Shopyz ont refusé la commande #${ref}.`, "/admin/dashboard?section=livraisons")
        )
      );
    } catch (e) {
      // ignore
    }
  }
  res.json({ ok: true });
});

module.exports = {
  delegateToShopyz,
  getPendingDispatch,
  dispatchToCouriers,
  getAvailableDispatch,
  claimDelivery,
  declineDelivery,
};
