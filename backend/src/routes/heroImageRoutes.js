const express = require("express");
const { getHeroImages } = require("../controllers/heroImageController");

const router = express.Router();

router.get("/", getHeroImages);

module.exports = router;
