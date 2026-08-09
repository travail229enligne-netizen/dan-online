const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const Shop = require("../models/Shop");

// @route   GET /api/products
// @access  Public - catalogue avec filtres
const getProducts = asyncHandler(async (req, res) => {
  const { category, shop, search, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (shop) filter.shop = shop;
  if (search && search.trim()) filter.name = { $regex: search.trim(), $options: "i" };

  const products = await Product.find(filter)
    .populate("shop", "name slug isVerified")
    .populate("category", "name icon")
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ soldCount: -1, createdAt: -1 });

  const total = await Product.countDocuments(filter);
  res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("shop", "name slug isVerified")
    .populate("category", "name icon");
  if (!product) return res.status(404).json({ message: "Produit introuvable." });
  res.json(product);
});

// @route   POST /api/products
// @access  Private (marchand)
const createProduct = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(400).json({ message: "Créez d'abord votre boutique." });
  if (shop.status !== "active") {
    return res.status(403).json({ message: "Votre boutique n'est pas encore validée par l'administrateur." });
  }

  const { name, description, price, unit, stock, category, images } = req.body;
  const product = await Product.create({
    shop: shop._id,
    category,
    name,
    description,
    price,
    unit,
    stock,
    images,
  });

  res.status(201).json(product);
});

// @route   PUT /api/products/:id
// @access  Private (marchand, propriétaire uniquement)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("shop");
  if (!product) return res.status(404).json({ message: "Produit introuvable." });
  if (product.shop.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Ce produit ne vous appartient pas." });
  }

  const fields = ["name", "description", "price", "unit", "stock", "category", "images", "isActive"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });

  await product.save();
  res.json(product);
});

// @route   DELETE /api/products/:id
// @access  Private (marchand, propriétaire uniquement)
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
