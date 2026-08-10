const asyncHandler = require("express-async-handler");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Shop = require("../models/Shop");

// @route   GET /api/messages/conversations
// @access  Private (client ou marchand) - liste ses conversations
const getConversations = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === "client") {
    filter = { client: req.user._id };
  } else if (req.user.role === "marchand") {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) return res.json([]);
    filter = { shop: shop._id };
  } else {
    return res.status(403).json({ message: "Accès non autorisé." });
  }

  const conversations = await Conversation.find(filter)
    .populate("client", "name")
    .populate("shop", "name")
    .sort({ lastMessageAt: -1 });

  res.json(conversations);
});

// @route   POST /api/messages/start/:shopId
// @access  Private (client) - demarre ou recupere une conversation avec une boutique
const startConversation = asyncHandler(async (req, res) => {
  let conversation = await Conversation.findOne({ client: req.user._id, shop: req.params.shopId });
  if (!conversation) {
    conversation = await Conversation.create({ client: req.user._id, shop: req.params.shopId });
  }
  res.json(conversation);
});

// @route   GET /api/messages/:conversationId
// @access  Private (participant a la conversation)
const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.conversationId).populate("shop");
  if (!conversation) return res.status(404).json({ message: "Conversation introuvable." });

  const isClient = conversation.client.toString() === req.user._id.toString();
  const isMerchant = conversation.shop.owner.toString() === req.user._id.toString();
  if (!isClient && !isMerchant) {
    return res.status(403).json({ message: "Accès non autorisé à cette conversation." });
  }

  const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });

  // Marquer comme lu pour le lecteur actuel
  if (isClient) conversation.unreadForClient = 0;
  if (isMerchant) conversation.unreadForMerchant = 0;
  await conversation.save();

  res.json({ conversation, messages });
});

// @route   POST /api/messages/:conversationId
// @access  Private (participant a la conversation)
const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const { imageUrl } = req.body;
  if ((!text || !text.trim()) && !imageUrl) return res.status(400).json({ message: "Message vide." });

  const conversation = await Conversation.findById(req.params.conversationId).populate("shop");
  if (!conversation) return res.status(404).json({ message: "Conversation introuvable." });

  const isClient = conversation.client.toString() === req.user._id.toString();
  const isMerchant = conversation.shop.owner.toString() === req.user._id.toString();
  if (!isClient && !isMerchant) {
    return res.status(403).json({ message: "Accès non autorisé à cette conversation." });
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    senderRole: isClient ? "client" : "marchand",
    text: text ? text.trim() : "",
    imageUrl: imageUrl || "",
  });

  conversation.lastMessage = text && text.trim() ? text.trim() : "Photo envoyée";
  conversation.lastMessageAt = new Date();
  if (isClient) conversation.unreadForMerchant += 1;
  if (isMerchant) conversation.unreadForClient += 1;
  await conversation.save();

  res.status(201).json(message);
});

module.exports = { getConversations, startConversation, getMessages, sendMessage };
