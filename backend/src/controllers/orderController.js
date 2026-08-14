const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const { resolveCommissionRate } = require("../utils/commission");
const { notify } = require("../utils/notify");

// @route   POST /api/orders
// @access  Private (client) - passe une commande en paiement à la livraison
const createOrder = asyncHandler(async (req, res) => {
  const { items, deliveryAddress, deliveryPhone } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Le panier est vide." });
  }

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

  const deliveryFee = 0; // à ajuster selon zone de livraison
  const grandTotal = itemsTotal + deliveryFee;

  const order = await Order.create({
    client: req.user._id,
    items: orderItems,
    deliveryAddress,
    deliveryPhone,
    itemsTotal,
    commissionAmount,
    deliveryFee,
    grandTotal,
    expectedDeliveryHours: 48,
  });

  const shopIds = [...new Set(orderItems.map((it) => it.shop.toString()))];
  for (const shopId of shopIds) {
    const s = await Shop.findById(shopId);
    if (s) {
      await notify(
        s.owner,
        "new_order",
        "Nouvelle commande",
        `Une commande vient d'être passée sur ta boutique.`,
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
  if (status === "delivered") order.paidAt = new Date();

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
