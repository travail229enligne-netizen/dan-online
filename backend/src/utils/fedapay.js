const { FedaPay, Transaction, Payout } = require("fedapay");

FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(process.env.FEDAPAY_ENV === "live" ? "live" : "sandbox");

// Cree une transaction FedaPay et renvoie le lien de paiement
async function createCheckout({ amount, description, callbackUrl }) {
  const transaction = await Transaction.create({
    description,
    amount: Math.round(Number(amount)),
    currency: { iso: "XOF" },
    callback_url: callbackUrl,
  });
  const tokenObject = await transaction.generateToken();
  return { transactionId: String(transaction.id), url: tokenObject.url };
}

// Verifie une transaction cote serveur (source de verite). "approved" => "SUCCESS"
async function verifyTransaction(transactionId) {
  const t = await Transaction.retrieve(transactionId);
  const raw = String(t.status || "").toLowerCase();
  return {
    status: raw === "approved" ? "SUCCESS" : raw.toUpperCase(),
    amount: Number(t.amount || 0),
    raw,
  };
}

// Cree un depot (payout) FedaPay ; l'envoi se fait ensuite avec payout.sendNow()
async function createPayout({ amount, description, customer }) {
  return Payout.create({
    amount: Math.round(Number(amount)),
    currency: { iso: "XOF" },
    description,
    customer,
  });
}

// Statut d'un depot (source de verite) : pending, started, processing, sent, failed
async function retrievePayout(payoutId) {
  const p = await Payout.retrieve(payoutId);
  return { id: String(p.id), status: String(p.status || "").toLowerCase() };
}

module.exports = { createCheckout, verifyTransaction, createPayout, retrievePayout };
