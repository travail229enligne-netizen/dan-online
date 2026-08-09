const asyncHandler = require("express-async-handler");
const Favorite = require("../models/Favorite");

// @route   GET /api/favorites
// @access  Private (client) - liste des favoris de l'utilisateur
const getFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id }).populate({
    path: "product",
    populate: { path: "shop", select: "name slug" },
  });
  res.json(favorites.filter((f) => f.product).map((f) => f.product));
});

// @route   POST /api/favorites/:productId
// @access  Private (client) - ajoute un produit aux favoris
const addFavorite = asyncHandler(async (req, res) => {
  try {
    const fav = await Favorite.create({ user: req.user._id, product: req.params.productId });
    res.status(201).json(fav);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Déjà dans vos favoris." });
    }
    throw err;
  }
});

// @route   DELETE /api/favorites/:productId
// @access  Private (client) - retire un produit des favoris
const removeFavorite = asyncHandler(async (req, res) => {
  await Favorite.findOneAndDelete({ user: req.user._id, product: req.params.productId });
  res.json({ message: "Retiré des favoris." });
});

module.exports = { getFavorites, addFavorite, removeFavorite };
