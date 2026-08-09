const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Shop = require("../models/Shop");

// @route   GET /api/reviews/shop/:shopId
// @access  Public - liste des avis d'une boutique
const getShopReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ shop: req.params.shopId })
    .populate("client", "name")
    .sort({ createdAt: -1 });

  const avg =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  res.json({ reviews, average: avg, count: reviews.length });
});

// @route   POST /api/reviews
// @access  Private (client) - laisse un avis sur une commande livree
const createReview = asyncHandler(async (req, res) => {
  const { orderId, shopId, rating, comment } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Commande introuvable." });
  if (order.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Cette commande ne vous appartient pas." });
  }
  if (order.status !== "delivered") {
    return res.status(400).json({ message: "Vous ne pouvez noter qu'une commande livree." });
  }

  const belongsToOrder = order.items.some((it) => it.shop.toString() === shopId);
  if (!belongsToOrder) {
    return res.status(400).json({ message: "Cette boutique ne fait pas partie de la commande." });
  }

  const existing = await Review.findOne({ order: orderId, shop: shopId, client: req.user._id });
  if (existing) {
    return res.status(400).json({ message: "Vous avez deja note cette boutique pour cette commande." });
  }

  const review = await Review.create({
    shop: shopId,
    client: req.user._id,
    order: orderId,
    rating,
    comment: comment || "",
  });

  const allReviews = await Review.find({ shop: shopId });
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await Shop.findByIdAndUpdate(shopId, { rating: avg });

  res.status(201).json(review);
});

module.exports = { getShopReviews, createReview };
