const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const User = require("../models/User");
const { resolveCommissionRate } = require("../utils/commission");
const { notify } = require("../utils/notify");
const { verifyTransaction } = require("../utils/kkiapay");
const { sendEmail } = require("../utils/email");

const createOrder = asyncHandler(async (req, res) => {
  const { items, deliveryAddress, deliveryPhone, deliveryCity, selfDelivery, paymentMethod } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Le panier est vide." });
  }

  const method = paymentMethod === "kkiapay" ? "kkiapay" : "cod";

  let itemsTotal = 0;
  let commissionAmount = 0;
  const orderItems = [];
  const shopCache = {};

  for (const it of items) {
    const product = await Product.findById(it.productId).populate("shop");
    if (!product || !product.isActive) {
      return res.status(400).json({ message: `Produit indisponible : ${it.productId}` });
    }
    if (product.stock < it.quantity) {
      return res.status(400).json({ message: `Stock insuffisant pour ${product.name}.` });
    }

    const lineTotal = product.price * it.quantity;
    itemsTotal += lineTotal;
    const rate = await resolveCommissionRate(product.shop._id, product.category);
    commissionAmount += (lineTotal * rate) / 100;

    orderItems.push({
      product: product._id,
      shop: product.shop._id,
      name: product.name,
      price: product.price,
      quantity: it.quantity,
    });

    shopCache[product.shop._id.toString()] = product.shop;

    product.stock -= it.quantity;
    product.soldCount += it.quantity;
    await product.save();
  }

  let deliveryFee = 0;
  const shopDeliveryFees = [];
  const isSelfDelivery = !!selfDelivery;

  if (!isSelfDelivery) {
    for (const shopId of Object.keys(shopCache)) {
      const shop = shopCache[shopId];
      let fee = 0;
      if (deliveryCity && Array.isArray(shop.deliveryZones)) {
        const zone = shop.deliveryZones.find(
          (z) => z.city.toLowerCase() === deliveryCity.trim().toLowerCase()
        );
        if (zone) fee = zone.price;
      }
      shopDeliveryFees.push({ shop: shopId, fee });
      deliveryFee += fee;
    }
  } else {
    for (const shopId of Object.keys(shopCache)) {
      shopDeliveryFees.push({ shop: shopId, fee: 0 });
    }
  }

  const grandTotal = itemsTotal + deliveryFee;

  // Le paiement en ligne se fait desormais au moment de la livraison, pas a la commande.
  const order = await Order.create({
    client: req.user._id,
    items: orderItems,
    deliveryAddress,
    deliveryPhone,
    deliveryCity: deliveryCity || "",
    selfDelivery: isSelfDelivery,
    shopDeliveryFees,
    paymentMethod: method,
    paymentStatus: "pending",
    itemsTotal,
    commissionAmount,
    deliveryFee,
    grandTotal,
    status: "confirmed",
    expectedDeliveryHours: 48,
  });

  const shopIds = Object.keys(shopCache);
  for (const shopId of shopIds) {
    const s = shopCache[shopId];
    if (s) {
      await notify(
        s.owner,
        "new_order",
        "Nouvelle commande à préparer",
        method === "kkiapay"
          ? "Une nouvelle commande vient d'être passée. Le client paiera en ligne au moment de la livraison."
          : "Une nouvelle commande vient d'être passée sur votre boutique. Le règlement se fera en espèces à la livraison.",
        "/marchand/commandes"
      );
    }
  }

  await notify(
    req.user._id,
    "order_status",
    "Merci pour votre commande",
    method === "kkiapay"
      ? `Votre commande de ${grandTotal.toLocaleString("fr-FR")} FCFA a bien été enregistrée. Vous pourrez régler en ligne dès que le livreur sera en route.`
      : `Votre commande de ${grandTotal.toLocaleString("fr-FR")} FCFA a bien été enregistrée. Merci de prévoir le montant en espèces pour le livreur. Livraison estimée sous 48h.`,
    "/commandes"
  );

  const client = await User.findById(req.user._id);
  if (client?.email) {
    const itemsHtml = orderItems.map((it) => `<li>${it.quantity} × ${it.name} — ${(it.price * it.quantity).toLocaleString("fr-FR")} FCFA</li>`).join("");
    const paymentLine = method === "kkiapay"
      ? "Vous pourrez régler en ligne dès que le livreur sera en route avec votre commande."
      : `Merci de prévoir <strong>${grandTotal.toLocaleString("fr-FR")} FCFA</strong> en espèces pour le livreur.`;

    await sendEmail(
      client.email,
      "Confirmation de votre commande EasyShop",
      `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
          <h2 style="color: #111;">Merci pour votre commande, ${client.name} !</h2>
          <p>Votre commande a bien été enregistrée et est en cours de préparation.</p>
          <ul style="padding-left: 18px;">${itemsHtml}</ul>
          <p style="font-weight: bold; font-size: 16px;">Total : ${grandTotal.toLocaleString("fr-FR")} FCFA</p>
          <p>${paymentLine}</p>
          <p style="color: #666; font-size: 13px;">Livraison estimée sous 48h à l'adresse : ${deliveryAddress}${deliveryCity ? `, ${deliveryCity}` : ""}.</p>
          <p style="color: #666; font-size: 13px;">Merci de votre confiance,<br/>L'équipe EasyShop</p>
        </div>
      `
    );
  }

  res.status(201).json(order);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ client: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

const getShopOrders = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const orders = await Order.find({ "items.shop": shop._id }).sort({ createdAt: -1 });
  res.json(orders);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("client", "name phone");
  if (!order) return res.status(404).json({ message: "Commande introuvable." });

  const isClient = order.client._id.toString() === req.user._id.toString();
  const isCourier = order.assignedCourier && order.assignedCourier.toString() === req.user._id.toString();
  let isMerchant = false;
  if (req.user.role === "marchand") {
    const shop = await Shop.findOne({ owner: req.user._id });
    isMerchant = shop && order.items.some((it) => it.shop.toString() === shop._id.toString());
  }

  if (!isClient && !isMerchant && !isCourier && req.user.role !== "admin") {
    return res.status(403).json({ message: "Accès non autorisé à cette commande." });
  }

  res.json(order);
});

// @route   PUT /api/orders/:id/pay
// @access  Private (client, proprietaire de la commande) - paiement en ligne, une fois le livreur en route
const payOrder = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) return res.status(400).json({ message: "Transaction de paiement manquante." });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Commande introuvable." });

  if (order.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Cette commande ne vous appartient pas." });
  }
  if (order.paymentMethod !== "kkiapay") {
    return res.status(400).json({ message: "Cette commande n'utilise pas le paiement en ligne." });
  }
  if (order.paymentStatus === "paid") {
    return res.status(400).json({ message: "Cette commande est déjà payée." });
  }

  let payment;
  try {
    payment = await verifyTransaction(transactionId);
    console.log("Kkiapay verify response:", JSON.stringify(payment));
  } catch (err) {
    console.error("Kkiapay verify error:", err.message, err.response?.data);
    return res.status(400).json({ message: "Impossible de vérifier le paiement. Réessayez." });
  }

  const status = (payment?.status || payment?.transactionStatus || "").toString().toUpperCase();
  if (status !== "SUCCESS") {
    return res.status(400).json({ message: `Le paiement n'a pas été confirmé (statut: ${status || "inconnu"}).` });
  }

  order.paymentStatus = "paid";
  order.paidAt = new Date();
  order.kkiapayTransactionId = transactionId;
  await order.save();

  res.json(order);
});

const respondAsCourier = asyncHandler(async (req, res) => {
  const { available } = req.body;
  const order = await Order.findById(req.params.id).populate("items.shop");
  if (!order) return res.status(404).json({ message: "Commande introuvable." });

  if (!order.assignedCourier || order.assignedCourier.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Tu n'es pas le livreur assigné à cette commande." });
  }

  order.courierStatus = available ? "available" : "unavailable";
  if (available) {
    order.status = "out_for_delivery";
  }
  await order.save();

  const shopOwners = [...new Set(order.items.map((it) => it.shop.owner.toString()))];
  for (const ownerId of shopOwners) {
    await notify(
      ownerId,
      "order_status",
      available ? "Livreur disponible" : "Livreur indisponible",
      available
        ? "Le livreur a confirmé sa disponibilité. La commande est maintenant en cours de livraison."
        : "Le livreur contacté n'est pas disponible. Merci d'en contacter un autre.",
      "/marchand/commandes"
    );
  }

  if (available) {
    await notify(
      order.client,
      "order_status",
      "Votre commande est en route",
      order.paymentMethod === "kkiapay"
        ? "Un livreur a été assigné à votre commande. Vous pouvez maintenant régler en ligne."
        : "Un livreur a été assigné et votre commande est maintenant en cours de livraison.",
      "/commandes"
    );
  }

  res.json(order);
});

// @route   PUT /api/orders/:id/delivery-proof
// @access  Private (livreur assigne ou client)
const submitDeliveryProof = asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ message: "Image requise." });

  const order = await Order.findById(req.params.id).populate("items.shop");
  if (!order) return res.status(404).json({ message: "Commande introuvable." });

  const isCourier = order.assignedCourier && order.assignedCourier.toString() === req.user._id.toString();
  const isClient = order.client.toString() === req.user._id.toString();
  if (!isCourier && !isClient) {
    return res.status(403).json({ message: "Accès non autorisé." });
  }

  if (order.paymentMethod === "kkiapay" && order.paymentStatus !== "paid") {
    return res.status(400).json({ message: "Le client doit d'abord régler en ligne avant l'envoi de la preuve de livraison." });
  }

  order.deliveryProofUrl = imageUrl;
  await order.save();

  const shopOwners = [...new Set(order.items.map((it) => it.shop.owner.toString()))];
  for (const ownerId of shopOwners) {
    await notify(
      ownerId,
      "order_status",
      "Preuve de livraison reçue",
      "La preuve de livraison a été envoyée. Vous pouvez maintenant marquer la commande comme livrée.",
      "/marchand/commandes"
    );
  }

  res.json(order);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Commande introuvable." });

  order.status = status;
  if (status === "delivered" && order.paymentMethod === "cod" && order.paymentStatus !== "paid") {
    order.paymentStatus = "paid";
    order.paidAt = new Date();
  }
  await order.save();

  const statusLabels = {
    confirmed: "confirmée",
    out_for_delivery: "en cours de livraison",
    delivered: "livrée",
    cancelled: "annulée",
  };
  if (statusLabels[status]) {
    await notify(order.client, "order_status", "Mise à jour de votre commande", `Votre commande est maintenant ${statusLabels[status]}.`, "/commandes");
  }

  res.json(order);
});

module.exports = {
  createOrder,
  getMyOrders,
  getShopOrders,
  getOrderById,
  payOrder,
  respondAsCourier,
  submitDeliveryProof,
  updateOrderStatus,
};
