const axios = require("axios");

// Verifie une transaction Kkiapay cote serveur (source de verite, ne jamais faire confiance au frontend seul)
async function verifyTransaction(transactionId) {
  const url = "https://api.kkiapay.me/api/v1/transactions/status";
  const response = await axios.post(
    url,
    { transactionId },
    {
      headers: {
        "x-private-key": process.env.KKIAPAY_PRIVATE_KEY,
        "x-secret-key": process.env.KKIAPAY_SECRET_KEY,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data; // contient notamment { status, amount, ... }
}

module.exports = { verifyTransaction };
