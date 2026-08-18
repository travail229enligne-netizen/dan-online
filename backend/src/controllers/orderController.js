const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const { resolveCommissionRate } = require("../utils/commission");
const { notify } = require("../utils/notify");
const { verifyTransaction } = require("../utils/kkiapay");

// @route   POST /api/orders
// @access  Private (client) - passe une commande apres verification du paiement Kkiapay
const createOrder = asyncHandler(async (req, res) => {
  const { items, deliveryAddress, deliveryPhone, transactionId } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Le panier est vide." });
  }
  if (!transactionId) {
    return res.status(400).json({ message: "Paiement requis avant de passer la commande." });
  }

  // 1. Verification du paiement aupres de Kkiapay (source de verite serveur)
  let payment;
  try {
    payment = await verifyTransaction(transactionId);
  } catch (err) {
    return res.status(400).json({ message: "Impossible de verifier le paiement. Reessayez." });
  }
  if (!payment || payment.status !== "SUCCESS") {
    return res.status(400).json({ message: "Le paiement n'a pas ete confirme." });
  }

  // 2. Construction de la commande a partir du panier (comme avant)
  let itemsTotal = 0;
  let commissionAmount = 0;
  const orderItems = [];

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

    product.stock -= it.quantity;
    product.soldCount += it.quantity;
    await product.save();
  }

  const deliveryFee = 0; // frais de livraison geres separement en especes avec le livreur
  const grandTotal = itemsTotal + deliveryFee;

  // 3. Verification du montant paye (protection contre falsification cote client)
  const paidAmount = Number(payment.amount);
  if (Math.abs(paidAmount - grandTotal) > 1) {
    return res.status(400).json({ message: "Le montant paye ne correspond pas au total de la commande." });
  }

  const order = await Order.create({
    client: req.user._id,
    items: orderItems,
    deliveryAddress,
    deliveryPhone,
    paymentMethod: "kkiapay",
    kkiapayTransactionId: transactionId,
    paymentStatus: "paid",
    paidAt: new Date(),
    itemsTotal,
    commissionAmount,
    deliveryFee,
    grandTotal,
    status: "confirmed",
    expectedDeliveryHours: 48,
  });

  const shopIds = [...new Set(orderItems.map((it) => it.shop.toString()))];
  for (const shopId of shopIds) {
    const s = await Shop.findById(shopId);
    if (s) {
      await notify(
        s.owner,
        "new_order",
        "Nouvelle commande payee",
        `Une commande vient d'etre payee sur ta boutique.`,
        "/marchand/commandes"
      );
    }
  }

  res.status(201).json(order);
});

// @route   GET /api/orders/mine
// @access  Private (client)
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ client: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @route   GET /api/orders/shop
// @access  Private (marchand) - commandes contenant les produits de sa boutique
const getShopOrders = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const orders = await Order.find({ "items.shop": shop._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @route   PUT /api/orders/:id/status
// @access  Private (marchand/admin) - met à jour le statut (confirmée, livrée...)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Commande introuvable." });

  order.status = status;

  await order.save();

  const statusLabels = {
    confirmed: "confirmée",
    out_for_delivery: "en cours de livraison",
    delivered: "livrée",
    cancelled: "annulée",
  };
  if (statusLabels[status]) {
    await notify(
      order.client,
      "order_status",
      "Commande mise à jour",
      `Ta commande est maintenant ${statusLabels[status]}.`,
      "/commandes"
    );
  }

  res.json(order);
});

module.exports = { createOrder, getMyOrders, getShopOrders, updateOrderStatus };
