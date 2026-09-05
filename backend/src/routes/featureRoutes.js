const express = require("express");
const { getFeaturePrice, featureMyShop, featureMyProduct } = require("../controllers/featureController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.use(protect, authorize("marchand"));

router.get("/price", getFeaturePrice);
router.post("/shop", featureMyShop);
router.post("/product/:id", featureMyProduct);

module.exports = router;
