const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Shop = require("../models/Shop");
const User = require("../models/User");
const notifyMod = require("../utils/notify");
const notify = notifyMod.notify || notifyMod;

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
  const orders = await Order.find({ shopyzDelivery: "awaiting_dispatch" })
    .populate("shopyzDelegatedBy", "name")
    .sort({ shopyzDelegatedAt: -1 });
  res.json(orders);
});

module.exports = { delegateToShopyz, getPendingDispatch };
