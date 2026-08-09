const express = require("express");
const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");
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

// @route   PUT /api/categories/:id/commission
// @access  Private (admin) - regle le taux de commission specifique a une categorie
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

module.exports = router;
