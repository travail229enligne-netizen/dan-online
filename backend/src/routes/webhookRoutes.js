const express = require("express");
const { handleFedaPayWebhook } = require("../controllers/webhookController");

const router = express.Router();

// Important : express.raw() ici, PAS express.json() - la verification de
// signature FedaPay a besoin du corps brut de la requete, non transforme.
router.post("/fedapay", express.raw({ type: "application/json" }), handleFedaPayWebhook);

module.exports = router;
