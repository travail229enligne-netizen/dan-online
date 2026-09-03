const asyncHandler = require("express-async-handler");
const Collection = require("../models/Collection");
const Shop = require("../models/Shop");

// @route   GET /api/collections/shop/:shopId
// @access  Public - collections d'une boutique avec leurs produits
const getShopCollections = asyncHandler(async (req, res) => {
  const collections = await Collection.find({ shop: req.params.shopId }).populate("products");
  res.json(collections);
});

// @route   GET /api/collections/search?q=...
// @access  Public - recherche de collections par nom, sur des boutiques actives
const searchCollections = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);

  const activeShops = await Shop.find({ status: "active" }).select("_id name slug logoUrl");
  const activeShopIds = activeShops.map((s) => s._id);
  const shopMap = Object.fromEntries(activeShops.map((s) => [s._id.toString(), s]));

  const collections = await Collection.find({
    name: { $regex: q.trim(), $options: "i" },
    shop: { $in: activeShopIds },
  }).limit(10);

  const results = collections.map((c) => ({
    _id: c._id,
    name: c.name,
    productCount: c.products.length,
    shop: shopMap[c.shop.toString()],
  }));

  res.json(results);
});

// @route   GET /api/collections/mine
// @access  Private (marchand) - ses propres collections
const getMyCollections = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });
  const collections = await Collection.find({ shop: shop._id }).populate("products", "name price images");
  res.json(collections);
});

// @route   POST /api/collections
// @access  Private (marchand) - cree une collection
const createCollection = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associée." });

  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: "Nom de collection requis." });

  const collection = await Collection.create({ shop: shop._id, name: name.trim(), products: [] });
  res.status(201).json(collection);
});

// @route   PUT /api/collections/:id
// @access  Private (marchand, proprietaire) - renomme ou change les produits
const updateCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id).populate("shop");
  if (!collection) return res.status(404).json({ message: "Collection introuvable." });
  if (collection.shop.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Cette collection ne vous appartient pas." });
  }

  if (req.body.name !== undefined) collection.name = req.body.name.trim();
  if (req.body.products !== undefined) collection.products = req.body.products;

  await collection.save();
  res.json(collection);
});

// @route   DELETE /api/collections/:id
// @access  Private (marchand, proprietaire)
const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id).populate("shop");
  if (!collection) return res.status(404).json({ message: "Collection introuvable." });
  if (collection.shop.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Cette collection ne vous appartient pas." });
  }
  await collection.deleteOne();
  res.json({ message: "Collection supprimée." });
});

module.exports = {
  getShopCollections,
  searchCollections,
  getMyCollections,
  createCollection,
  updateCollection,
  deleteCollection,
};
