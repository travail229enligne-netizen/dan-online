const express = require("express");
const { getFeaturePrice, initFeature, confirmFeature } = require("../controllers/featureController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.use(protect, authorize("marchand"));

router.get("/price", getFeaturePrice);

router.post("/init", initFeature);
router.post("/confirm", confirmFeature);

module.exports = router;
