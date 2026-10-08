const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const Promotion = require("../models/Promotion");
const User = require("../models/User");
const { resolveCommissionRate } = require("../utils/commission");
const { notify } = require("../utils/notify");
const { createCheckout, verifyTransaction } = require("../utils/fedapay");
const { sendEmail } = require("../utils/email");
const { sendOrderConversions } = require("../services/adConversions");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

async function notifyOrderCompletion(order) {
  const shopOwnerIds = [...new Set(order.items.map((it) => it.shop.owner.toString()))];
  for (const ownerId of shopOwnerIds) {
    await notify(
      ownerId,
      "order_status",
      "Paiement recu",
      "Le paiement de la commande (" + order.grandTotal.toLocaleString("fr-FR") + " FCFA) a ete confirme.",
      "/marchand/commandes"
    );
  }

  if (order.assignedCourier) {
    await notify(
      order.assignedCourier,
      "order_status",
      "Course terminee",
      "Livraison effectuee avec succes. Merci pour ton travail !",
      "/livreur/portefeuille"
    );
  }

  await notify(
    order.client,
    "order_status",
    "Merci pour ta commande !",
    "Ta commande est livree et payee. N'hesite pas a laisser un avis sur les produits achetes.",
    "/commandes"
  );

  const admins = await User.find({ role: "admin" }).select("_id");
  for (const admin of admins) {
    await notify(
      admin._id,
      "order_status",
      "Nouvelle vente",
      "Une commande de " + order.grandTotal.toLocaleString("fr-FR") + " FCFA a ete finalisee. Commission : " + order.commissionAmount.toLocaleString("fr-FR") + " FCFA.",
      "/admin/dashboard"
    );
  }
}

const createOrder = asyncHandler(async (req, res) => {
  const { items, name, deliveryAddress, deliveryPhone, deliveryCity, selfDelivery, paymentMethod, promoCodes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Le panier est vide." });
  }

  let currentUser = req.user;
  let freshToken = null;

  if (!currentUser) {
    if (!deliveryPhone || !name) {
      return res.status(400).json({ message: "Nom et téléphone requis pour passer commande." });
    }

    const existing = await User.findOne({ phone: deliveryPhone.trim() });

    if (existing && existing.password) {
      return res.status(409).json({
        requireLogin: true,
        message: "Ce numéro est déjà associé à un compte. Connectez-vous pour continuer.",
      });
    }

    if (existing) {
      existing.name = name;
      if (deliveryAddress) existing.address = deliveryAddress;
      await existing.save();
      currentUser = existing;
    } else {
      currentUser = await User.create({
        name,
        phone: deliveryPhone.trim(),
        address: deliveryAddress || "",
        role: "client",
      });
    }

    freshToken = generateToken(currentUser._id);
  }

  const method = "kkiapay"; // Paiement en especes desactive : Mobile Money uniquement

  let itemsTotal = 0;
  let commissionAmount = 0;
  const orderItems = [];
  const shopCache = {};

  for (const it of items) {
    const productDoc = await Product.findById(it.productId).populate("shop");

    if (!productDoc || !productDoc.isActive) {
      const label = productDoc ? productDoc.name : null;
      return res.status(400).json({
        code: "PRODUCT_UNAVAILABLE",
        productId: it.productId,
        message: label
          ? `"${label}" n'est plus disponible. Retire-le de ton panier pour continuer.`
          : "Un article de ton panier n'est plus disponible. Retire-le pour continuer.",
      });
    }

    const product = productDoc;
    if (product.stock < it.quantity) {
      return res.status(400).json({
        code: "PRODUCT_OUT_OF_STOCK",
        productId: it.productId,
        message: `Stock insuffisant pour "${product.name}" (${product.stock} restant${product.stock > 1 ? "s" : ""}).`,
      });
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

  let discountAmount = 0;
  const appliedPromoCodes = [];

  if (promoCodes && typeof promoCodes === "object") {
    for (const shopId of Object.keys(promoCodes)) {
      const code = (promoCodes[shopId] || "").trim().toUpperCase();
      if (!code) continue;

      const promo = await Promotion.findOne({ shop: shopId, code });
      if (!promo || !promo.active) continue;

      const now = new Date();
      if (promo.startDate && now < promo.startDate) continue;
      if (promo.endDate && now > promo.endDate) continue;
      if (promo.usageLimit && promo.timesUsed >= promo.usageLimit) continue;

      const shopItems = orderItems.filter((it) => it.shop.toString() === shopId);
      const eligibleItems =
        promo.appliesTo === "products"
          ? shopItems.filter((it) => promo.products.some((p) => p.toString() === it.product.toString()))
          : shopItems;

      if (eligibleItems.length === 0) continue;

      const eligibleSubtotal = eligibleItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const shopDiscount =
        promo.type === "percent"
          ? (eligibleSubtotal * promo.value) / 100
          : Math.min(promo.value, eligibleSubtotal);
      if (shopDiscount <= 0) continue;

      discountAmount += shopDiscount;
      appliedPromoCodes.push({ shop: shopId, code });

      promo.timesUsed += 1;
      await promo.save();
    }
  }

  if (discountAmount > 0 && itemsTotal > 0) {
    const ratio = (itemsTotal - discountAmount) / itemsTotal;
    commissionAmount = commissionAmount * ratio;
  }

  const grandTotal = Math.max(0, itemsTotal - discountAmount) + deliveryFee;

  const order = await Order.create({
    client: currentUser._id,
    items: orderItems,
    deliveryAddress,
    deliveryPhone,
    deliveryCity: deliveryCity || "",
    selfDelivery: isSelfDelivery,
    shopDeliveryFees,
    paymentMethod: method,
    paymentStatus: "pending",
    itemsTotal,
    discountAmount,
    appliedPromoCodes,
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
          ? "Une nouvelle commande vient d'être passée. Le client réglera en ligne une fois la livraison effectuée."
          : "Une nouvelle commande vient d'être passée sur votre boutique. Le règlement se fera en espèces à la livraison.",
        "/marchand/commandes"
      );
    }
  }

  await notify(
    currentUser._id,
    "order_status",
    "Merci pour votre commande",
    method === "kkiapay"
      ? `Votre commande de ${grandTotal.toLocaleString("fr-FR")} FCFA a bien été enregistrée. Vous pourrez régler en ligne une fois la livraison effectuée.`
      : `Votre commande de ${grandTotal.toLocaleString("fr-FR")} FCFA a bien été enregistrée. Merci de prévoir le montant en espèces pour le livreur. Livraison estimée sous 48h.`,
    "/commandes"
  );

  const client = await User.findById(currentUser._id);
  if (client?.email) {
    const itemsHtml = orderItems.map((it) => `<li>${it.quantity} × ${it.name} — ${(it.price * it.quantity).toLocaleString("fr-FR")} FCFA</li>`).join("");
    const paymentLine = method === "kkiapay"
      ? "Vous pourrez régler en ligne une fois votre commande livrée."
      : `Merci de prévoir <strong>${grandTotal.toLocaleString("fr-FR")} FCFA</strong> en espèces pour le livreur.`;

    await sendEmail(
      client.email,
      "Confirmation de votre commande Shopyz",
      `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
          <h2 style="color: #111;">Merci pour votre commande, ${client.name} !</h2>
          <p>Votre commande a bien été enregistrée et est en cours de préparation.</p>
          <ul style="padding-left: 18px;">${itemsHtml}</ul>
          <p style="font-weight: bold; font-size: 16px;">Total : ${grandTotal.toLocaleString("fr-FR")} FCFA</p>
          <p>${paymentLine}</p>
          <p style="color: #666; font-size: 13px;">Livraison estimée sous 48h à l'adresse : ${deliveryAddress}${deliveryCity ? `, ${deliveryCity}` : ""}.</p>
          <p style="color: #666; font-size: 13px;">Merci de votre confiance,<br/>L'équipe Shopyz</p>
        </div>
      `
    );
  }

  const response = order.toObject();
  if (freshToken) {
    response.token = freshToken;
    response.user = currentUser.toSafeObject();
  }

  response.shopBreakdown = shopIds.map((shopId) => {
    const s = shopCache[shopId];
    const shopItemsTotal = orderItems
      .filter((it) => it.shop.toString() === shopId)
      .reduce((sum, it) => sum + it.price * it.quantity, 0);
    return {
      shopId,
      pixels: s ? s.pixels : null,
      value: shopItemsTotal,
      contents: orderItems
        .filter((it) => it.shop.toString() === shopId)
        .map((it) => ({ id: it.product.toString(), quantity: it.quantity, item_price: it.price })),
    };
  });

  sendOrderConversions({
    order,
    shopIds,
    client,
    tracking: req.body.tracking,
    ip: ((req.headers["x-forwarded-for"] || "").split(",")[0] || "").trim() || req.ip,
    userAgent: req.get("user-agent") || "",
  }).catch(() => {});

  res.status(201).json(response);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ client: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

const getPendingPaymentOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    client: req.user._id,
    paymentMethod: "kkiapay",
    paymentStatus: { $ne: "paid" },
    deliveryProofUrl: { $ne: "" },
  }).sort({ createdAt: -1 });

  res.json({ orderId: order ? order._id : null });
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

const initPayment = asyncHandler(async (req, res) => {
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
  if (!order.deliveryProofUrl) {
    return res.status(400).json({ message: "La preuve de livraison n'a pas encore été reçue." });
  }

  const frontendUrl = process.env.FRONTEND_URL || "https://dan-online.vercel.app";
  let checkout;
  try {
    checkout = await createCheckout({
      amount: order.grandTotal,
      description: `Commande #${order._id.toString().slice(-6).toUpperCase()}`,
      callbackUrl: `${frontendUrl}/payer-commande/${order._id}?retour=1`,
    });
  } catch (err) {
    console.error("FedaPay init error:", err.message);
    return res.status(502).json({ message: "Impossible d'ouvrir le paiement. Réessayez dans un instant." });
  }

  await Order.updateOne({ _id: order._id }, { $set: { fedapayTransactionId: checkout.transactionId } });
  res.json({ url: checkout.url });
});

const payOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.shop");
  if (!order) return res.status(404).json({ message: "Commande introuvable." });

  if (order.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Cette commande ne vous appartient pas." });
  }
  if (order.paymentMethod !== "kkiapay") {
    return res.status(400).json({ message: "Cette commande n'utilise pas le paiement en ligne." });
  }
  if (order.paymentStatus === "paid") {
    return res.json(order);
  }
  if (!order.deliveryProofUrl) {
    return res.status(400).json({ message: "La preuve de livraison n'a pas encore été reçue." });
  }
  if (!order.fedapayTransactionId) {
    return res.status(400).json({ message: "Aucun paiement en cours pour cette commande." });
  }

  let payment;
  try {
    payment = await verifyTransaction(order.fedapayTransactionId);
    console.log("FedaPay verify response:", JSON.stringify(payment));
  } catch (err) {
    console.error("FedaPay verify error:", err.message);
    return res.status(400).json({ message: "Impossible de vérifier le paiement. Réessayez." });
  }

  if (payment.status !== "SUCCESS") {
    return res.status(400).json({ message: `Le paiement n'a pas été confirmé (statut: ${payment.status || "inconnu"}).` });
  }
  if (Number(payment.amount) < Number(order.grandTotal)) {
    return res.status(400).json({ message: "Le montant payé ne correspond pas à la commande." });
  }

  order.paymentStatus = "paid";
  order.paidAt = new Date();
  order.status = "delivered";
  await order.save();

  await notifyOrderCompletion(order);

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
      "Un livreur a été assigné et votre commande est maintenant en cours de livraison.",
      "/commandes"
    );
  }

  res.json(order);
});

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

  if (order.paymentMethod === "kkiapay") {
    await notify(
      order.client,
      "order_status",
      "Ta commande a été livrée",
      "Tu peux maintenant régler ta commande en ligne.",
      `/payer-commande/${order._id}`
    );
  }

  res.json(order);
});

const submitPaymentProof = asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ message: "Image requise." });

  const order = await Order.findById(req.params.id).populate("items.shop");
  if (!order) return res.status(404).json({ message: "Commande introuvable." });

  const isCourier = order.assignedCourier && order.assignedCourier.toString() === req.user._id.toString();
  if (!isCourier) {
    return res.status(403).json({ message: "Accès non autorisé." });
  }
  if (order.paymentMethod !== "cod") {
    return res.status(400).json({ message: "Cette commande n'utilise pas le paiement en espèces." });
  }
  if (!order.deliveryProofUrl) {
    return res.status(400).json({ message: "La preuve de livraison doit être envoyée en premier." });
  }

  order.paymentProofUrl = imageUrl;
  order.paymentStatus = "paid";
  order.paidAt = new Date();
  order.status = "delivered";
  await order.save();

  await notifyOrderCompletion(order);

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
    order.status = "delivered";
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
  getPendingPaymentOrder,
  getShopOrders,
  getOrderById,
  payOrder,
  respondAsCourier,
  submitDeliveryProof,
  submitPaymentProof,
  updateOrderStatus,
};

module.exports.initPayment = initPayment;
