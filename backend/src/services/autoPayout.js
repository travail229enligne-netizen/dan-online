const Withdrawal = require("../models/Withdrawal");
const Shop = require("../models/Shop");
const User = require("../models/User");
const { createPayout } = require("../utils/fedapay");

const isAutoEnabled = () => process.env.PAYOUT_AUTO === "true";
const maxAuto = () => Number(process.env.AUTO_PAYOUT_MAX || 50000);

// Numero Mobile Money -> format international (+229...)
function normalizePhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("229")) d = d.slice(3);
  if (d.length === 8) return "+229" + d;
  if (d.length === 10 && d.startsWith("01")) return "+229" + d;
  return null;
}

async function getRecipient(w) {
  let user = null;
  if (w.type === "shop") {
    const shop = await Shop.findById(w.shop).populate("owner");
    user = shop && shop.owner;
  } else {
    user = await User.findById(w.courier);
  }
  const full = String((user && user.name) || "Utilisateur Shopyz").trim();
  const parts = full.split(/\s+/);
  const customer = {
    firstname: parts[0] || "Shopyz",
    lastname: parts.slice(1).join(" ") || "Utilisateur",
  };
  if (user && user.email) customer.email = user.email;
  return customer;
}

// Tente un versement automatique. Dans tous les cas renvoie la demande a jour.
async function tryAutoPayout(w) {
  if (!isAutoEnabled() || w.type === "admin") return w;
  if (w.amount > maxAuto()) return w;

  const phone = normalizePhone(w.phone);
  if (!phone) return w;

  // Premier retrait d'un compte : validation manuelle
  const owner = w.type === "shop" ? { shop: w.shop } : { courier: w.courier };
  const previous = await Withdrawal.countDocuments({ ...owner, type: w.type, status: "paid" });
  if (previous === 0) return w;

  // Reservation atomique : une demande ne part qu'une fois
  const claimed = await Withdrawal.findOneAndUpdate(
    { _id: w._id, status: "pending" },
    { $set: { status: "processing" } },
    { new: true }
  );
  if (!claimed) return w;

  let payout = null;
  try {
    const customer = await getRecipient(w);
    customer.phone_number = { number: phone, country: "bj" };
    payout = await createPayout({
      amount: w.amount,
      description: "Retrait Shopyz " + w._id,
      customer,
    });
    await Withdrawal.updateOne({ _id: w._id }, { $set: { fedapayPayoutId: String(payout.id) } });
    await payout.sendNow();
    return await Withdrawal.findById(w._id);
  } catch (err) {
    console.error("Auto payout error:", err.message);
    const note = payout
      ? "Verifier FedaPay (depot " + payout.id + ") avant tout paiement manuel : " + err.message
      : "Echec du versement automatique : " + err.message;
    await Withdrawal.updateOne({ _id: w._id }, { $set: { status: "pending", note } });
    return await Withdrawal.findById(w._id);
  }
}

module.exports = { tryAutoPayout, normalizePhone };
