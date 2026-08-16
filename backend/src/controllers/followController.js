const asyncHandler = require("express-async-handler");
const Follow = require("../models/Follow");

// @route   GET /api/follows
// @access  Private (client) - liste des boutiques suivies
const getMyFollows = asyncHandler(async (req, res) => {
  const follows = await Follow.find({ user: req.user._id }).populate("shop", "name slug logoUrl city isVerified");
  res.json(follows.filter((f) => f.shop).map((f) => f.shop));
});

// @route   GET /api/follows/status/:shopId
// @access  Private (client) - verifie si l'utilisateur suit deja cette boutique
const getFollowStatus = asyncHandler(async (req, res) => {
  const follow = await Follow.findOne({ user: req.user._id, shop: req.params.shopId });
  res.json({ following: !!follow });
});

// @route   POST /api/follows/:shopId
// @access  Private (client) - suit une boutique
const followShop = asyncHandler(async (req, res) => {
  try {
    await Follow.create({ user: req.user._id, shop: req.params.shopId });
    res.status(201).json({ following: true });
  } catch (err) {
    if (err.code === 11000) return res.json({ following: true });
    throw err;
  }
});

// @route   DELETE /api/follows/:shopId
// @access  Private (client) - ne suit plus une boutique
const unfollowShop = asyncHandler(async (req, res) => {
  await Follow.findOneAndDelete({ user: req.user._id, shop: req.params.shopId });
  res.json({ following: false });
});

module.exports = { getMyFollows, getFollowStatus, followShop, unfollowShop };
