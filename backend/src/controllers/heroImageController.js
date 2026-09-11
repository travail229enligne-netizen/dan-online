const asyncHandler = require("express-async-handler");
const HeroImage = require("../models/HeroImage");

// @route   GET /api/hero-images
// @access  Public
const getHeroImages = asyncHandler(async (req, res) => {
  const images = await HeroImage.find().sort({ businessType: 1, order: 1 });
  res.json(images);
});

// @route   POST /api/admin/hero-images
// @access  Private (admin)
const addHeroImage = asyncHandler(async (req, res) => {
  const { imageUrl, businessType, order } = req.body;
  if (!imageUrl || !businessType) {
    return res.status(400).json({ message: "Image et type de commerce requis." });
  }
  const image = await HeroImage.create({ imageUrl, businessType, order: order || 0 });
  res.status(201).json(image);
});

// @route   DELETE /api/admin/hero-images/:id
// @access  Private (admin)
const deleteHeroImage = asyncHandler(async (req, res) => {
  const image = await HeroImage.findByIdAndDelete(req.params.id);
  if (!image) return res.status(404).json({ message: "Image introuvable." });
  res.json({ message: "Image supprimée." });
});

module.exports = { getHeroImages, addHeroImage, deleteHeroImage };
