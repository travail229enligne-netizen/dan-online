const asyncHandler = require("express-async-handler");
const Shop = require("../models/Shop");
const Product = require("../models/Product");
const FeaturePayment = require("../models/FeaturePayment");
const { createCheckout, verifyTransaction } = require("../utils/fedapay");

const SHOP_PRICE_PER_DAY = 1000;
const PRODUCT_PRICE_PER_DAY = 300;

// @route   GET /api/feature/price?target=shop|product&days=N
const getFeaturePrice = asyncHandler(async (req, res) => {
  const { target, days } = req.query;
  const nbDays = Number(days);
  if (!["shop", "product"].includes(target) || !nbDays || nbDays <= 0) {
    return res.status(400).json({ message: "Parametres invalides." });
  }
  const pricePerDay = target === "shop" ? SHOP_PRICE_PER_DAY : PRODUCT_PRICE_PER_DAY;
  res.json({ pricePerDay, days: nbDays, total: pricePerDay * nbDays });
});

// @route   POST /api/feature/init
// body: { target: "shop"|"product", days, productId? }
// Cree un achat de mise en avant + la transaction FedaPay, renvoie le lien de paiement
const initFeature = asyncHandler(async (req, res) => {
  const { target, productId } = req.body;
  const nbDays = Number(req.body.days);
  if (!["shop", "product"].includes(target) || !Number.isInteger(nbDays) || nbDays <= 0 || nbDays > 365) {
    return res.status(400).json({ message: "Parametres invalides." });
  }

  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });
  if (shop.status !== "active") {
    return res.status(403).json({ message: "Ta boutique doit etre active pour etre mise en avant." });
  }

  let product = null;
  if (target === "product") {
    product = productId ? await Product.findById(productId) : null;
    if (!product) return res.status(404).json({ message: "Produit introuvable." });
    if (product.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: "Ce produit ne vous appartient pas." });
    }
  }

  const amount = nbDays * (target === "shop" ? SHOP_PRICE_PER_DAY : PRODUCT_PRICE_PER_DAY);
  const fp = await FeaturePayment.create({
    user: req.user._id,
    target,
    shop: shop._id,
    product: product ? product._id : undefined,
    days: nbDays,
    amount,
  });

  const frontendUrl = process.env.FRONTEND_URL || "https://dan-online.vercel.app";
  try {
    const checkout = await createCheckout({
      amount,
      description: `Mise en avant ${target === "shop" ? "boutique" : "produit"} (${nbDays} jours)`,
      callbackUrl: `${frontendUrl}/marchand/booster?retour=1`,
    });
    fp.fedapayTransactionId = checkout.transactionId;
    await fp.save();
    res.json({ url: checkout.url });
  } catch (err) {
    console.error("FedaPay init error (feature):", err.message);
    await FeaturePayment.deleteOne({ _id: fp._id });
    res.status(502).json({ message: "Impossible d'ouvrir le paiement. Reessaie dans un instant." });
  }
});

// Applique les jours d'un achat de mise en avant UNE SEULE fois (reservation atomique)
async function settleFeaturePayment(fp, payment) {
  if (!payment || payment.status !== "SUCCESS" || Number(payment.amount) < Number(fp.amount)) return null;

  const claimed = await FeaturePayment.findOneAndUpdate(
    { _id: fp._id, status: "pending" },
    { $set: { status: "applied", appliedAt: new Date() } }
  );
  if (!claimed) return null;

  try {
    const Model = fp.target === "shop" ? Shop : Product;
    const doc = await Model.findById(fp.target === "shop" ? fp.shop : fp.product);
    if (!doc) throw new Error("Cible introuvable");
    const now = new Date();
    const base = doc.featuredUntil && new Date(doc.featuredUntil) > now ? new Date(doc.featuredUntil) : now;
    base.setDate(base.getDate() + fp.days);
    doc.featuredUntil = base;
    await doc.save();
    return { target: fp.target, days: fp.days };
  } catch (err) {
    console.error("Feature apply error:", err.message);
    await FeaturePayment.updateOne({ _id: fp._id }, { $set: { status: "pending", appliedAt: null } });
    return null;
  }
}

// @route   POST /api/feature/confirm
// Verifie cote serveur les paiements en attente du marchand (24h) et applique les jours une seule fois
const confirmFeature = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const pendings = await FeaturePayment.find({
    user: req.user._id,
    status: "pending",
    fedapayTransactionId: { $ne: "" },
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .limit(5);

  let applied = 0;
  let last = null;

  for (const fp of pendings) {
    let payment;
    try {
      payment = await verifyTransaction(fp.fedapayTransactionId);
    } catch (err) {
      console.error("FedaPay verify error (feature):", err.message);
      continue;
    }
    const result = await settleFeaturePayment(fp, payment);
    if (result) {
      applied += 1;
      last = result;
    }
  }

  res.json({ applied, last });
});

module.exports = { getFeaturePrice, initFeature, confirmFeature, settleFeaturePayment, SHOP_PRICE_PER_DAY, PRODUCT_PRICE_PER_DAY };
