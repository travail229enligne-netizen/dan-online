const asyncHandler = require("express-async-handler");
const PushSubscription = require("../models/PushSubscription");

// @route   GET /api/push/vapid-public-key
// @access  Public - le frontend a besoin de cette cle pour s'abonner
const getPublicKey = asyncHandler(async (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// @route   POST /api/push/subscribe
// @access  Private - enregistre l'abonnement push du navigateur de l'utilisateur connecte
const subscribe = asyncHandler(async (req, res) => {
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ message: "Abonnement push invalide." });
  }

  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { user: req.user._id, endpoint, keys },
    { upsert: true, new: true }
  );

  res.status(201).json({ message: "Abonnement enregistre." });
});

// @route   POST /api/push/unsubscribe
// @access  Private
const unsubscribe = asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    await PushSubscription.deleteOne({ endpoint, user: req.user._id });
  }
  res.json({ message: "Desabonnement effectue." });
});

module.exports = { getPublicKey, subscribe, unsubscribe };
