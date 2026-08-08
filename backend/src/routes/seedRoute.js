const express = require("express");
const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");
const Shop = require("../models/Shop");
const Product = require("../models/Product");
const User = require("../models/User");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    if (req.query.key !== process.env.SEED_KEY) {
      return res.status(403).json({ message: "Clé invalide." });
    }

    const categories = [
      { name: "Vivres Frais", slug: "vivres-frais", icon: "🥬", color: "#F5A623" },
      { name: "Pagnes & Tissus", slug: "pagnes-tissus", icon: "🧵", color: "#B33F3F" },
      { name: "Artisanat Local", slug: "artisanat-local", icon: "🏺", color: "#8B5E3C" },
      { name: "Produits Beauté", slug: "produits-beaute", icon: "🧴", color: "#C97B4A" },
    ];
    const saved = {};
    for (const c of categories) {
      saved[c.slug] = await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
    }

    let admin = await User.findOne({ email: "admin@dan-online.bj" });
    if (!admin) {
      admin = await User.create({
        name: "Administrateur Dan-Online",
        email: "admin@dan-online.bj",
        phone: "+22900000000",
        password: "ChangeMoi123!",
        role: "admin",
      });
    }

    let owner = await User.findOne({ email: "adjoua@dan-online.bj" });
    if (!owner) {
      owner = await User.create({
        name: "Maman Adjoua",
        email: "adjoua@dan-online.bj",
        phone: "+22900000001",
        password: "ChangeMoi123!",
        role: "marchand",
      });
    }

    let shop = await Shop.findOne({ slug: "chez-maman-adjoua" });
    if (!shop) {
      shop = await Shop.create({
        owner: owner._id,
        name: "Chez Maman Adjoua",
        slug: "chez-maman-adjoua",
        description: "Fruits et légumes frais du marché.",
        category: saved["vivres-frais"]._id,
        location: { allee: "Allée 3", numero: "N°45" },
        isVerified: true,
        status: "active",
      });
      await User.findByIdAndUpdate(owner._id, { shop: shop._id });
    }

    const count = await Product.countDocuments({ shop: shop._id });
    if (count === 0) {
      await Product.create([
        {
          shop: shop._id,
          category: saved["vivres-frais"]._id,
          name: "Tomates Fraîches",
          price: 1500,
          unit: "kg",
          stock: 30,
        },
        {
          shop: shop._id,
          category: saved["vivres-frais"]._id,
          name: "Ananas Pain de Sucre",
          price: 1000,
          unit: "unité",
          stock: 20,
        },
      ]);
    }

    res.json({ message: "Données de démonstration créées avec succès." });
  })
);

module.exports = router;
