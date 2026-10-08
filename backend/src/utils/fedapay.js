const { FedaPay, Transaction } = require("fedapay");

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

module.exports = { createCheckout, verifyTransaction };
