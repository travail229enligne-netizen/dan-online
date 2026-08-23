cat > src/controllers/orderController.js << 'EOF'
const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const { resolveCommissionRate } = require("../utils/commission");
const { notify } = require("../utils/notify");
const { verifyTransaction } = require("../utils/kkiapay");

const createOrder = asyncHandler(async (req, res) => {
  const { items, deliveryAddress, deliveryPhone, transactionId } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Le panier est vide." });
  }
  if (!transactionId) {
    return res.status(400).json({ message: "Paiement requis avant de passer la commande." });
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

  const deliveryFee = 0;
  const grandTotal = itemsTotal + deliveryFee;

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

  await notify(
    req.user._id,
    "order_status",
    "Commande confirmee et payee",
    `Ta commande de ${grandTotal} FCFA a ete confirmee. Livraison estimee sous 48h.`,
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
    await notify(order.client, "order_status", "Commande mise à jour", `Ta commande est maintenant ${statusLabels[status]}.`, "/commandes");
  }

  res.json(order);
});

module.exports = { createOrder, getMyOrders, getShopOrders, updateOrderStatus };
