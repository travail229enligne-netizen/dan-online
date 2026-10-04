const Shop = require("../models/Shop");

const clean = (v, max) => String(v || "").trim().slice(0, max);
const SELECT = "+adApi.metaToken +adApi.metaTestCode +adApi.tiktokToken +adApi.tiktokTestCode";

const getMyAdApi = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id }).select(SELECT);
    if (!shop) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });
    const a = shop.adApi || {};
    res.json({
      metaTokenSet: !!a.metaToken,
      metaTestCode: a.metaTestCode || "",
      tiktokTokenSet: !!a.tiktokToken,
      tiktokTestCode: a.tiktokTestCode || "",
    });
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

const updateMyAdApi = async (req, res) => {
  try {
    const b = req.body || {};
    const set = {};
    if (typeof b.metaToken === "string" && b.metaToken.trim()) set["adApi.metaToken"] = clean(b.metaToken, 600);
    else if (b.removeMetaToken === true) set["adApi.metaToken"] = "";
    if (typeof b.metaTestCode === "string") set["adApi.metaTestCode"] = clean(b.metaTestCode, 40);
    if (typeof b.tiktokToken === "string" && b.tiktokToken.trim()) set["adApi.tiktokToken"] = clean(b.tiktokToken, 600);
    else if (b.removeTiktokToken === true) set["adApi.tiktokToken"] = "";
    if (typeof b.tiktokTestCode === "string") set["adApi.tiktokTestCode"] = clean(b.tiktokTestCode, 40);
    if (Object.keys(set).length === 0) return res.json({ ok: true });
    const result = await Shop.updateOne({ owner: req.user._id }, { $set: set });
    if (!(result.matchedCount ?? result.n)) return res.status(404).json({ message: "Aucune boutique associee a ce compte." });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

module.exports = { getMyAdApi, updateMyAdApi };
