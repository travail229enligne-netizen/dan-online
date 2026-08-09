const express = require("express");
const { getFavorites, addFavorite, removeFavorite } = require("../controllers/favoriteController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

router.use(protect, authorize("client"));

router.get("/", getFavorites);
router.post("/:productId", addFavorite);
router.delete("/:productId", removeFavorite);

module.exports = router;
