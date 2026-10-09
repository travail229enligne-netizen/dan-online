const express = require("express");
const { handleFedapayWebhook } = require("../controllers/webhookController");

const router = express.Router();
// Corps brut obligatoire pour verifier la signature
router.post("/fedapay", express.raw({ type: "*/*", limit: "1mb" }), handleFedapayWebhook);

module.exports = router;
