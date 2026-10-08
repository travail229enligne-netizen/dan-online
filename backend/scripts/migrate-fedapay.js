// Convertit les anciennes commandes Kkiapay. Usage : MONGO_URI='...' node scripts/migrate-fedapay.js
const mongoose = require("mongoose");

(async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI manquant.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const col = mongoose.connection.collection("orders");
  const a = await col.updateMany({ paymentMethod: "kkiapay" }, { $set: { paymentMethod: "fedapay" } });
  const b = await col.updateMany(
    { kkiapayTransactionId: { $exists: true } },
    { $rename: { kkiapayTransactionId: "legacyTransactionId" } }
  );
  console.log("Commandes converties :", a.modifiedCount, "| references conservees :", b.modifiedCount);
  await mongoose.disconnect();
})().catch((e) => {
  console.error("ERREUR:", e.message);
  process.exit(1);
});
