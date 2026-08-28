const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const { resolveCommissionRate } = require("../utils/commission");
const { notify } = require("../utils/notify");
const { verifyTransaction } = require("../utils/kkiapay");

const createOrder = asyncHandler(async (req, res) => {
  const { items, deliveryAddress, deliveryPhone, deliveryCity, selfDelivery, transactionId, paymentMethod } = req.body;
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

  let paymentStatus = "pending";
  let paidAt = null;
  const grandTotal = itemsTotal + deliveryFee;

  if (method === "kkiapay") {
    if (!transactionId) {
      return res.status(400).json({ message: "Transaction de paiement manquante." });
    }

    let payment;
    try {
      payment = await verifyTransaction(transactionId);
      console.log("Kkiapay verify response:", JSON.stringify(payment));
    } catch (err) {
      console.error("Kkiapay verify error:", err.message, err.response?.data);
      return res.status(400).json({ message: "Impossible de verifier le paiement. Reessayez." });
    }

    const status = (payment?.status || payment?.transactionStatus || "").toString().toUpperCase();
    if (status !== "SUCCESS") {
      return res.status(400).json({ message: `Le paiement n'a pas ete confirme (statut: ${status || "inconnu"}).` });
    }

    paymentStatus = "paid";
    paidAt = new Date();
  }

  const order = await Order.create({
    client: req.user._id,
    items: orderItems,
    deliveryAddress,
    deliveryPhone,
    deliveryCity: deliveryCity || "",
    selfDelivery: isSelfDelivery,
    shopDeliveryFees,
    paymentMethod: method,
    kkiapayTransactionId: method === "kkiapay" ? transactionId : "",
    paymentStatus,
    paidAt,
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
        method === "kkiapay" ? "Nouvelle commande payee" : "Nouvelle commande (paiement a la livraison)",
        method === "kkiapay"
          ? "Une commande vient d'etre payee sur ta boutique."
          : "Une commande vient d'etre passee sur ta boutique. Le client paiera a la livraison.",
        "/marchand/commandes"
      );
    }
  }

  await notify(
    req.user._id,
    "order_status",
    "Commande confirmee",
    method === "kkiapay"
      ? `Ta commande de ${grandTotal} FCFA a ete confirmee. Livraison estimee sous 48h.`
      : `Ta commande de ${grandTotal} FCFA a ete confirmee. Prevois le montant en especes pour le livreur. Livraison estimee sous 48h.`,
    "/commandes"
  );

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

// @route   GET /api/orders/:id
// @access  Private (marchand proprietaire de la boutique concernee, ou client de la commande)
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("client", "name phone");
  if (!order) return res.status(404).json({ message: "Commande introuvable." });

  const isClient = order.client._id.toString() === req.user._id.toString();
  let isMerchant = false;
  if (req.user.role === "marchand") {
    const shop = await Shop.findOne({ owner: req.user._id });
    isMerchant = shop && order.items.some((it) => it.shop.toString() === shop._id.toString());
  }

  if (!isClient && !isMerchant && req.user.role !== "admin") {
    return res.status(403).json({ message: "Accès non autorisé à cette commande." });
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
    await notify(order.client, "order_status", "Commande mise à jour", `Ta commande est maintenant ${statusLabels[status]}.`, "/commandes");
  }

  res.json(order);
});

module.exports = { createOrder, getMyOrders, getShopOrders, getOrderById, updateOrderStatus };
