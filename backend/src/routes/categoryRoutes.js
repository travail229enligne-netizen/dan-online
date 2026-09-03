const express = require("express");
const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  })
);

router.post(
  "/",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  })
);

router.put(
  "/:id/commission",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { commissionRate } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { commissionRate: commissionRate === "" || commissionRate === null ? null : Number(commissionRate) },
      { new: true }
    );
    if (!category) return res.status(404).json({ message: "Categorie introuvable." });
    res.json(category);
  })
);

router.get(
  "/seed-extra",
  asyncHandler(async (req, res) => {
    if (req.query.key !== process.env.SEED_KEY) {
      return res.status(403).json({ message: "Clé invalide." });
    }

    const extra = [
      { name: "Mode", slug: "mode", icon: "", color: "#111111" },
      { name: "Téléphones & Électronique", slug: "telephones-electronique", icon: "", color: "#111111" },
      { name: "Maison", slug: "maison", icon: "", color: "#111111" },
      { name: "Beauté", slug: "beaute", icon: "", color: "#111111" },
      { name: "Alimentation", slug: "alimentation", icon: "", color: "#111111" },
      { name: "Électroménager", slug: "electromenager", icon: "", color: "#111111" },
      { name: "Informatique", slug: "informatique", icon: "", color: "#111111" },
      { name: "Chaussures", slug: "chaussures", icon: "", color: "#111111" },
      { name: "Accessoires", slug: "accessoires", icon: "", color: "#111111" },
      { name: "Matériaux de Construction", slug: "materiaux-construction", icon: "", color: "#111111" },
      { name: "Automobile & Pièces", slug: "automobile-pieces", icon: "", color: "#111111" },
      { name: "Agriculture", slug: "agriculture", icon: "", color: "#111111" },
      { name: "Sport & Loisirs", slug: "sport-loisirs", icon: "", color: "#111111" },
      { name: "Restaurants", slug: "restaurants", icon: "", color: "#111111" },
      { name: "Services", slug: "services", icon: "", color: "#111111" },
    ];

    const results = [];
    for (const c of extra) {
      const saved = await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
      results.push(saved.name);
    }

    res.json({ message: "Catégories ajoutées avec succès.", categories: results });
  })
);

// @route   GET /api/categories/merge-mode-vetements?key=SEED_KEY
// @access  Protege par cle - fusionne Chaussures dans Mode, renomme Mode en "Mode & Vetements"
// A visiter UNE SEULE FOIS depuis un navigateur.
router.get(
  "/merge-mode-vetements",
  asyncHandler(async (req, res) => {
    if (req.query.key !== process.env.SEED_KEY) {
      return res.status(403).json({ message: "Clé invalide." });
    }

    const mode = await Category.findOne({ slug: "mode" });
    const chaussures = await Category.findOne({ slug: "chaussures" });

    if (!mode) {
      return res.status(404).json({ message: "Catégorie 'Mode' introuvable." });
    }

    mode.name = "Mode & Vêtements";
    mode.slug = "mode-vetements";
    await mode.save();

    let movedCount = 0;
    if (chaussures) {
      const result = await Product.updateMany({ category: chaussures._id }, { category: mode._id });
      movedCount = result.modifiedCount || 0;
      await chaussures.deleteOne();
    }

    res.json({
      message: `Fusion terminée. Catégorie renommée en "${mode.name}". ${movedCount} produit(s) déplacé(s) depuis Chaussures.`,
    });
  })
);

module.exports = router;
