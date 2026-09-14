const asyncHandler = require("express-async-handler");
const PlatformCourier = require("../models/PlatformCourier");
const User = require("../models/User");

// @route   GET /api/platform-couriers
// @access  Private (tout utilisateur connecté)
const getPlatformCouriers = asyncHandler(async (req, res) => {
  const couriers = await PlatformCourier.find().sort({ name: 1 });
  res.json(couriers);
});

// @route   POST /api/admin/platform-couriers
// @access  Private (admin)
const addPlatformCourier = asyncHandler(async (req, res) => {
  const { phone, name } = req.body;
  if (!phone || !phone.trim()) {
    return res.status(400).json({ message: "Numéro de téléphone requis." });
  }

  const courierUser = await User.findOne({ phone: phone.trim() });
  if (!courierUser) {
    return res.status(404).json({ message: "Aucun compte Shopyz n'est associé à ce numéro. Le livreur doit d'abord créer un compte." });
  }

  const alreadyAdded = await PlatformCourier.findOne({ user: courierUser._id });
  if (alreadyAdded) {
    return res.status(400).json({ message: "Ce livreur est déjà dans la liste Shopyz." });
  }

  const courier = await PlatformCourier.create({
    user: courierUser._id,
    name: name?.trim() || courierUser.name,
    phone: phone.trim(),
  });

  res.status(201).json(courier);
});

// @route   DELETE /api/admin/platform-couriers/:userId
// @access  Private (admin)
const removePlatformCourier = asyncHandler(async (req, res) => {
  await PlatformCourier.findOneAndDelete({ user: req.params.userId });
  const couriers = await PlatformCourier.find().sort({ name: 1 });
  res.json(couriers);
});

module.exports = { getPlatformCouriers, addPlatformCourier, removePlatformCourier };
