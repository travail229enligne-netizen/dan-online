const asyncHandler = require("express-async-handler");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Shop = require("../models/Shop");
const Order = require("../models/Order");
const { notify } = require("../utils/notify");

// @route   GET /api/messages/conversations
// @access  Private (client, marchand ou livreur) - liste ses conversations
const getConversations = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });

  const orConditions = [{ client: req.user._id }, { courier: req.user._id }];
  if (shop) orConditions.push({ shop: shop._id });

  const conversations = await Conversation.find({ $or: orConditions })
    .populate("client", "name")
    .populate("courier", "name")
    .populate("shop", "name logoUrl")
    .sort({ lastMessageAt: -1 });

  res.json(conversations);
});

// @route   POST /api/messages/start/:shopId
// @access  Private (client) - demarre ou recupere une conversation avec une boutique
const startConversation = asyncHandler(async (req, res) => {
  let conversation = await Conversation.findOne({ type: "client_shop", client: req.user._id, shop: req.params.shopId });
  if (!conversation) {
    conversation = await Conversation.create({ type: "client_shop", client: req.user._id, shop: req.params.shopId });
  }
  res.json(conversation);
});

// @route   POST /api/messages/start-courier
// @access  Private (marchand) - demarre/recupere une conversation avec un livreur et lui assigne une commande
// body: { courierId, orderId }
const startCourierConversation = asyncHandler(async (req, res) => {
  const { courierId, orderId } = req.body;
  if (!courierId || !orderId) return res.status(400).json({ message: "Livreur et commande requis." });

  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });

  const isKnownCourier = shop.couriers.some((c) => c.user.toString() === courierId);
  if (!isKnownCourier) {
    return res.status(400).json({ message: "Ce livreur n'est pas dans ta liste. Ajoute-le d'abord." });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Commande introuvable." });

  let conversation = await Conversation.findOne({ type: "shop_courier", shop: shop._id, courier: courierId });
  if (!conversation) {
    conversation = await Conversation.create({ type: "shop_courier", shop: shop._id, courier: courierId, order: orderId });
  } else {
    conversation.order = orderId;
    await conversation.save();
  }

  order.assignedCourier = courierId;
  order.courierStatus = "pending";
  await order.save();

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    senderRole: "marchand",
    kind: "order_summary",
    order: order._id,
    text: "",
  });

  conversation.lastMessage = "📦 Nouvelle commande à livrer";
  conversation.lastMessageAt = new Date();
  conversation.unreadForClient += 1; // reutilise ce compteur pour le livreur
  await conversation.save();

  await notify(courierId, "message", "Nouvelle commande à livrer", "Une boutique t'a envoyé une commande à livrer.", `/messages/c/${conversation._id}`);

  res.json(conversation);
});

// @route   GET /api/messages/:conversationId
// @access  Private (participant a la conversation)
const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.conversationId)
    .populate("client", "name phone")
    .populate("courier", "name phone")
    .populate({ path: "shop", select: "name logoUrl owner", populate: { path: "owner", select: "phone" } });
  if (!conversation) return res.status(404).json({ message: "Conversation introuvable." });

  const isClient = conversation.client && conversation.client._id.toString() === req.user._id.toString();
  const isCourier = conversation.courier && conversation.courier._id.toString() === req.user._id.toString();
  const isMerchant = conversation.shop.owner._id.toString() === req.user._id.toString();
  if (!isClient && !isCourier && !isMerchant) {
    return res.status(403).json({ message: "Accès non autorisé à cette conversation." });
  }

  const messages = await Message.find({ conversation: conversation._id })
    .populate("order")
    .sort({ createdAt: 1 });

  if (isClient || isCourier) conversation.unreadForClient = 0;
  if (isMerchant) conversation.unreadForMerchant = 0;
  await conversation.save();

  res.json({ conversation, messages });
});

// @route   POST /api/messages/:conversationId
// @access  Private (participant a la conversation)
const sendMessage = asyncHandler(async (req, res) => {
  const { text, imageUrl } = req.body;
  if ((!text || !text.trim()) && !imageUrl) return res.status(400).json({ message: "Message vide." });

  const conversation = await Conversation.findById(req.params.conversationId).populate("shop");
  if (!conversation) return res.status(404).json({ message: "Conversation introuvable." });

  const isClient = conversation.client && conversation.client.toString() === req.user._id.toString();
  const isCourier = conversation.courier && conversation.courier.toString() === req.user._id.toString();
  const isMerchant = conversation.shop.owner.toString() === req.user._id.toString();
  if (!isClient && !isCourier && !isMerchant) {
    return res.status(403).json({ message: "Accès non autorisé à cette conversation." });
  }

  const senderRole = isCourier ? "livreur" : isClient ? "client" : "marchand";
  const recipient = isMerchant ? (conversation.client || conversation.courier) : conversation.shop.owner;

  await notify(
    recipient,
    "message",
    "Nouveau message",
    text ? text.trim().slice(0, 80) : "Photo envoyée",
    `/messages/c/${conversation._id}`
  );

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    senderRole,
    text: text ? text.trim() : "",
    imageUrl: imageUrl || "",
  });

  conversation.lastMessage = text && text.trim() ? text.trim() : "Photo envoyée";
  conversation.lastMessageAt = new Date();
  if (isClient || isCourier) conversation.unreadForMerchant += 1;
  if (isMerchant) conversation.unreadForClient += 1;
  await conversation.save();

  res.status(201).json(message);
});

module.exports = { getConversations, startConversation, startCourierConversation, getMessages, sendMessage };
