const { kkiapay } = require("@kkiapay-org/nodejs-sdk");

const k = kkiapay({
  privatekey: process.env.KKIAPAY_PRIVATE_KEY,
  publickey: process.env.KKIAPAY_PUBLIC_KEY,
  secretkey: process.env.KKIAPAY_SECRET_KEY,
  sandbox: process.env.KKIAPAY_SANDBOX === "true",
});

// Verifie une transaction Kkiapay cote serveur (source de verite, ne jamais faire confiance au frontend seul)
async function verifyTransaction(transactionId) {
  const response = await k.verify(transactionId);
  return response; // contient notamment { status, amount, ... }
}

module.exports = { verifyTransaction };
