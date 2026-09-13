const asyncHandler = require("express-async-handler");
const Fair = require("../models/Fair");
const Shop = require("../models/Shop");
const Product = require("../models/Product");
const { notify } = require("../utils/notify");

const populateFair = (query) =>
  query
    .populate("organizerShop", "name slug logoUrl")
    .populate("participants.shop", "name slug logoUrl")
    .populate("entries.shop", "name slug")
    .populate("entries.product", "name price images");

// @route   GET /api/fairs
// @access  Public - foires actuellement actives (dates en cours)
const getActiveFairs = asyncHandler(async (req, res) => {
  const now = new Date();
  const fairs = await populateFair(
    Fair.find({ startDate: { $lte: now }, endDate: { $gte: now } }).sort({ createdAt: -1 })
  );
  res.json(fairs);
});

// @route   GET /api/fairs/:id
// @access  Public
const getFairById = asyncHandler(async (req, res) => {
  const fair = await populateFair(Fair.findById(req.params.id));
  if (!fair) return res.status(404).json({ message: "Foire introuvable." });
  res.json(fair);
});

// @route   GET /api/fairs/me
// @access  Private (marchand) - foires ou sa boutique est organisatrice ou participante
const getMyFairs = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const fairs = await populateFair(
    Fair.find({
      $or: [{ organizerShop: shop._id }, { "participants.shop": shop._id }],
    }).sort({ createdAt: -1 })
  );
  res.json(fairs);
});

// @route   POST /api/fairs
// @access  Private (marchand)
const createFair = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const { title, description, bannerImage, startDate, endDate } = req.body;
  if (!title || !startDate || !endDate) {
    return res.status(400).json({ message: "Titre et dates requis." });
  }
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ message: "La date de fin doit être après la date de début." });
  }

  const fair = await Fair.create({
    organizerShop: shop._id,
    title,
    description: description || "",
    bannerImage: bannerImage || "",
    startDate,
    endDate,
    participants: [{ shop: shop._id, status: "accepted" }],
    entries: [],
  });

  res.status(201).json(fair);
});

// @route   POST /api/fairs/:id/invite
// @access  Private (marchand organisateur)
const inviteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const fair = await Fair.findById(req.params.id);
  if (!fair) return res.status(404).json({ message: "Foire introuvable." });
  if (fair.organizerShop.toString() !== shop._id.toString()) {
    return res.status(403).json({ message: "Seul l'organisateur peut inviter des boutiques." });
  }

  const { shopId } = req.body;
  if (!shopId) return res.status(400).json({ message: "Boutique à inviter requise." });

  const targetShop = await Shop.findById(shopId);
  if (!targetShop) return res.status(404).json({ message: "Boutique introuvable." });

  const already = fair.participants.some((p) => p.shop.toString() === shopId);
  if (already) return res.status(400).json({ message: "Cette boutique est déjà invitée ou participante." });

  fair.participants.push({ shop: shopId, status: "pending" });
  await fair.save();

  await notify(
    targetShop.owner,
    "fair_invite",
    "Invitation à une Foire",
    `${shop.name} t'invite à participer à la Foire "${fair.title}".`,
    "/marchand/foires"
  );

  res.json(fair);
});

// @route   PUT /api/fairs/:id/respond
// @access  Private (marchand invite)
const respondInvite = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const fair = await Fair.findById(req.params.id);
  if (!fair) return res.status(404).json({ message: "Foire introuvable." });

  const participant = fair.participants.find((p) => p.shop.toString() === shop._id.toString());
  if (!participant) return res.status(404).json({ message: "Tu n'es pas invité à cette Foire." });

  const { accept } = req.body;
  participant.status = accept ? "accepted" : "declined";
  await fair.save();

  res.json(fair);
});

// @route   PUT /api/fairs/:id/products
// @access  Private (marchand participant accepte)
const updateMyEntries = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const fair = await Fair.findById(req.params.id);
  if (!fair) return res.status(404).json({ message: "Foire introuvable." });

  const participant = fair.participants.find((p) => p.shop.toString() === shop._id.toString());
  if (!participant || participant.status !== "accepted") {
    return res.status(403).json({ message: "Tu dois être un participant accepté pour ajouter des produits." });
  }

  const { productIds } = req.body;
  if (!Array.isArray(productIds)) return res.status(400).json({ message: "Liste de produits invalide." });

  const ownProducts = await Product.find({ _id: { $in: productIds }, shop: shop._id });
  const validIds = ownProducts.map((p) => p._id.toString());

  fair.entries = fair.entries.filter((e) => e.shop.toString() !== shop._id.toString());
  validIds.forEach((productId) => fair.entries.push({ shop: shop._id, product: productId }));

  await fair.save();
  res.json(fair);
});

// @route   PUT /api/fairs/:id
// @access  Private (marchand organisateur)
const updateFair = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const fair = await Fair.findById(req.params.id);
  if (!fair) return res.status(404).json({ message: "Foire introuvable." });
  if (fair.organizerShop.toString() !== shop._id.toString()) {
    return res.status(403).json({ message: "Seul l'organisateur peut modifier cette Foire." });
  }

  const { title, description, bannerImage, startDate, endDate } = req.body;
  if (title !== undefined) fair.title = title;
  if (description !== undefined) fair.description = description;
  if (bannerImage !== undefined) fair.bannerImage = bannerImage;
  if (startDate !== undefined) fair.startDate = startDate;
  if (endDate !== undefined) fair.endDate = endDate;

  if (new Date(fair.endDate) < new Date(fair.startDate)) {
    return res.status(400).json({ message: "La date de fin doit être après la date de début." });
  }

  await fair.save();
  res.json(fair);
});

module.exports = {

  getActiveFairs,
  getFairById,
  getMyFairs,
  createFair,
  inviteShop,
  respondInvite,
  updateMyEntries,
  updateFair,
};
