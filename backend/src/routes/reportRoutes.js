const express = require("express");
const asyncHandler = require("express-async-handler");
const Report = require("../models/Report");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

// POST /api/reports - créer un signalement (client ou marchand connecté)
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "Le sujet et le message sont obligatoires." });
    }

    const report = await Report.create({
      author: req.user._id,
      authorRole: req.user.role,
      subject,
      message,
    });

    res.status(201).json(report);
  })
);

// GET /api/reports - liste des signalements (admin uniquement)
router.get(
  "/",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const reports = await Report.find()
      .populate("author", "name phone email role")
      .sort({ createdAt: -1 });
    res.json(reports);
  })
);

// PUT /api/reports/:id - marquer comme traité (admin uniquement)
router.put(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Signalement introuvable." });
    }
    report.status = req.body.status || "resolved";
    await report.save();
    res.json(report);
  })
);

module.exports = router;
