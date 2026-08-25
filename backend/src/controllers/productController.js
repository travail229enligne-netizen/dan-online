const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const Follow = require("../models/Follow");
const { notify } = require("../utils/notify");

function sanitizeTiers(tiers) {
  if (!Array.isArray(tiers)) return [];
  return tiers
    .filter((t) => t && t.minQty > 1 && t.price >= 0)
    .sort((a, b) => a.minQty - b.minQty);
}

const getProducts = asyncHandler(async (req, res) => {
  const { category, shop, search, minPrice, maxPrice, wholesale, location, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (shop) filter.shop = shop;
  if (search && search.trim()) filter.name = { $regex: search.trim(), $options: "i" };
  if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
  if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
  if (wholesale === "true") filter.priceTiers = { $exists: true, $not: { $size: 0 } };

  if (location && location.trim()) {
    const matchingShops = await Shop.find({
      status: "active",
      "location.allee": { $regex: location.trim(), $options: "i" },
    }).select("_id");
    filter.shop = { $in: matchingShops.map((s) => s._id) };
  }

  const products = await Product.find(filter)
    .populate("shop", "name slug isVerified businessType")
    .populate("category", "name icon")
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ featuredUntil: -1, soldCount: -1, createdAt: -1 });

  const total = await Product.countDocuments(filter);
  res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("shop", "name slug isVerified businessType")
    .populate("category", "name icon");
  if (!product) return res.status(404).json({ message: "Produit introuvable." });
  res.json(product);
});

const createProduct = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(400).json({ message: "Créez d'abord votre boutique." });
  if (shop.status !== "active") {
    return res.status(403).json({ message: "Votre boutique n'est pas encore validée par l'administrateur." });
  }

  const { name, description, price, unit, stock, category, images, priceTiers, prepTimeMinutes, isDailySpecial } = req.body;
  const product = await Product.create({
    shop: shop._id,
    category,
    name,
    description,
    price,
    unit,
    stock,
    images,
    priceTiers: sanitizeTiers(priceTiers),
    prepTimeMinutes: prepTimeMinutes ? Number(prepTimeMinutes) : null,
    isDailySpecial: !!isDailySpecial,
  });

  const followers = await Follow.find({ shop: shop._id });
  for (const f of followers) {
    await notify(
      f.user,
      "message",
      "Nouveau produit",
      `${shop.name} vient d'ajouter "${name}".`,
      `/produit/${product._id}`
    );
  }

  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("shop");
  if (!product) return res.status(404).json({ message: "Produit introuvable." });
  if (product.shop.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Ce produit ne vous appartient pas." });
  }

  const fields = ["name", "description", "price", "unit", "stock", "category", "images", "isActive", "prepTimeMinutes", "isDailySpecial"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });
  if (req.body.priceTiers !== undefined) {
    product.priceTiers = sanitizeTiers(req.body.priceTiers);
  }

  await product.save();
  res.json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("shop");
  if (!product) return res.status(404).json({ message: "Produit introuvable." });
  if (product.shop.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Ce produit ne vous appartient pas." });
  }
  await product.deleteOne();
  res.json({ message: "Produit supprimé." });
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
