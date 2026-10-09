const { Webhook } = require("fedapay");
const Order = require("../models/Order");
const FeaturePayment = require("../models/FeaturePayment");
const { verifyTransaction } = require("../utils/fedapay");
const { notifyOrderCompletion } = require("./orderController");
const { settleFeaturePayment } = require("./featureController");

// POST /api/webhooks/fedapay  (corps brut, signe par FedaPay)
const handleFedapayWebhook = async (req, res) => {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("FedaPay webhook: FEDAPAY_WEBHOOK_SECRET manquant.");
    return res.status(503).json({ message: "Webhook non configure." });
  }

  let event;
  try {
    const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body || "");
    event = Webhook.constructEvent(payload, req.headers["x-fedapay-signature"], secret);
    if (typeof event === "string") event = JSON.parse(event);
  } catch (err) {
    console.error("FedaPay webhook: signature invalide:", err.message);
    return res.status(400).json({ message: "Signature invalide." });
  }

  const name = event?.name || event?.type || "";
  const entity = event?.entity || event?.data || event?.object || {};
  const txId = entity?.id !== undefined && entity?.id !== null ? String(entity.id) : "";
  console.log("FedaPay webhook:", name, "| transaction:", txId || "?", "| cles:", Object.keys(event || {}).join(","));

  if (name !== "transaction.approved" || !txId) return res.json({ received: true });

  try {
    const payment = await verifyTransaction(txId);
    if (payment.status !== "SUCCESS") return res.json({ received: true });

    const order = await Order.findOne({
      $or: [{ fedapayTransactionId: txId }, { fedapayTransactionIds: txId }],
    }).populate("items.shop");

    if (order) {
      if (Number(payment.amount) < Number(order.grandTotal)) {
        console.error("FedaPay webhook: montant insuffisant pour la commande", order._id.toString());
        return res.json({ received: true });
      }
      const claimed = await Order.findOneAndUpdate(
        { _id: order._id, paymentStatus: { $ne: "paid" } },
        { $set: { paymentStatus: "paid", paidAt: new Date(), status: "delivered" } },
        { new: true }
      );
      if (claimed) {
        order.paymentStatus = "paid";
        order.paidAt = claimed.paidAt;
        order.status = "delivered";
        await notifyOrderCompletion(order);
      } else {
        console.log("FedaPay webhook: commande deja payee", order._id.toString());
      }
      return res.json({ received: true });
    }

    const fp = await FeaturePayment.findOne({ fedapayTransactionId: txId });
    if (fp) await settleFeaturePayment(fp, payment);

    return res.json({ received: true });
  } catch (err) {
    console.error("FedaPay webhook: erreur de traitement:", err.message);
    return res.status(500).json({ message: "Erreur de traitement." });
  }
};

module.exports = { handleFedapayWebhook };
