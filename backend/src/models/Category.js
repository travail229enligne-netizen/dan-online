const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    icon: { type: String, default: "" }, // emoji ou nom d'icône
    color: { type: String, default: "#F5A623" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
