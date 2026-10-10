const { Webhook } = require("fedapay");
const Order = require("../models/Order");
const { notify } = require("../utils/notify");

// Reutilise la meme logique de notification que les paiements classiques
async function notifyOrderCompletion(order) {
  const shopOwnerIds = [...new Set(order.items.map((it) => it.shop.owner.toString()))];
  for (const ownerId of shopOwnerIds) {
    await notify(
      ownerId,
      "order_status",
      "Paiement recu",
      "Le paiement de la commande (" + order.grandTotal.toLocaleString("fr-FR") + " FCFA) a ete confirme.",
      "/marchand/commandes"
    );
  }

  if (order.assignedCourier) {
    await notify(
      order.assignedCourier,
      "order_status",
      "Course terminee",
      "Livraison effectuee avec succes. Merci pour ton travail !",
      "/livreur/portefeuille"
    );
  }

  await notify(
    order.client,
    "order_status",
    "Merci pour ta commande !",
    "Ta commande est livree et payee. N'hesite pas a laisser un avis sur les produits achetes.",
    "/commandes"
  );

  const User = require("../models/User");
  const admins = await User.find({ role: "admin" }).select("_id");
  for (const admin of admins) {
    await notify(
      admin._id,
      "order_status",
      "Nouvelle vente",
      "Une commande de " + order.grandTotal.toLocaleString("fr-FR") + " FCFA a ete finalisee. Commission : " + order.commissionAmount.toLocaleString("fr-FR") + " FCFA.",
      "/admin/dashboard"
    );
  }
}

// @route   POST /api/webhooks/fedapay
// @access  Public (verifie par signature, pas par authentification classique)
const handleFedaPayWebhook = async (req, res) => {
  const signature = req.headers["x-fedapay-signature"];
  const endpointSecret = process.env.FEDAPAY_WEBHOOK_SECRET;

  let event;
  try {
    event = Webhook.constructEvent(req.body, signature, endpointSecret);
  } catch (err) {
    console.error("Webhook FedaPay invalide:", err.message);
    return res.status(400).send("Signature invalide.");
  }

  try {
    const entity = event.entity || {};
    const status = String(entity.status || "").toLowerCase();

    if (status === "approved" && entity.id) {
      const order = await Order.findOne({ fedapayTransactionId: String(entity.id) }).populate("items.shop");

      if (order && order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.paidAt = new Date();
        order.status = "delivered";
        await order.save();
        await notifyOrderCompletion(order);
      }
    }
  } catch (err) {
    console.error("Erreur traitement webhook FedaPay:", err.message);
  }

  res.status(200).send("OK");
};

module.exports = { handleFedaPayWebhook };
