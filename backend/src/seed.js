require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Category = require("./models/Category");

const run = async () => {
  await connectDB();

  const categories = [
    { name: "Vivres Frais", slug: "vivres-frais", icon: "🥬", color: "#F5A623" },
    { name: "Pagnes & Tissus", slug: "pagnes-tissus", icon: "🧵", color: "#B33F3F" },
    { name: "Artisanat Local", slug: "artisanat-local", icon: "🏺", color: "#8B5E3C" },
    { name: "Produits Beauté", slug: "produits-beaute", icon: "🧴", color: "#C97B4A" },
  ];

  for (const c of categories) {
    await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
  }
  console.log("✅ Catégories créées.");

  const adminEmail = "admin@dan-online.bj";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: "Administrateur Dan-Online",
      email: adminEmail,
      phone: "+22900000000",
      password: "ChangeMoi123!",
      role: "admin",
    });
    console.log(`✅ Compte admin créé : ${adminEmail} / ChangeMoi123!`);
  } else {
    console.log("ℹ️ Compte admin déjà existant.");
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
