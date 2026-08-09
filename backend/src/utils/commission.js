const Shop = require("../models/Shop");
const Category = require("../models/Category");

// Determine le taux de commission applicable pour un item de commande.
// Priorite : commission specifique a la boutique > commission de la categorie > defaut plateforme
async function resolveCommissionRate(shopId, categoryId) {
  const defaultRate = Number(process.env.DEFAULT_COMMISSION_RATE || 10);

  const shop = await Shop.findById(shopId).select("commissionRate");
  if (shop && shop.commissionRate !== null && shop.commissionRate !== undefined) {
    return shop.commissionRate;
  }

  if (categoryId) {
    const category = await Category.findById(categoryId).select("commissionRate");
    if (category && category.commissionRate !== null && category.commissionRate !== undefined) {
      return category.commissionRate;
    }
  }

  return defaultRate;
}

module.exports = { resolveCommissionRate };
