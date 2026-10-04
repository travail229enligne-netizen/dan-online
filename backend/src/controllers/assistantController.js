const asyncHandler = require("express-async-handler");
const { GoogleGenAI, Type } = require("@google/genai");
const Product = require("../models/Product");
const Shop = require("../models/Shop");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `Tu es l'assistant d'achat de Shopyz, une marketplace multi-vendeurs au Bénin.
Ton rôle : aider les utilisateurs à trouver rapidement des produits qui correspondent à ce qu'ils cherchent (type d'article, budget, ville de livraison).
Utilise toujours l'outil "search_products" pour chercher dans le vrai catalogue avant de répondre — ne invente jamais de produits ou de prix.
Réponds en français, de façon chaleureuse et concise (2-4 phrases). Si des résultats sont trouvés, résume-les brièvement (l'utilisateur verra les fiches produits juste en dessous de ton message, donc ne reliste pas tous les détails).
Si aucun résultat ne correspond, dis-le simplement et propose d'élargir la recherche (prix ou ville).
Si l'utilisateur veut négocier un prix sur un produit précis, utilise l'outil "negotiate_price".`;

const searchProductsDeclaration = {
  name: "search_products",
  description: "Recherche des produits dans le catalogue Shopyz par nom, prix maximum et ville de livraison.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Mots-clés du produit recherché, ex: 'jean', 'crampons'" },
      maxPrice: { type: Type.NUMBER, description: "Budget maximum en FCFA, si précisé par l'utilisateur" },
      city: { type: Type.STRING, description: "Ville de livraison souhaitée, ex: 'Abomey-Calavi'" },
    },
    required: ["query"],
  },
};

async function searchProducts({ query, maxPrice, city }) {
  const filter = { isActive: true };
  if (query && query.trim()) {
    filter.name = { $regex: query.trim(), $options: "i" };
  }
  if (maxPrice) {
    filter.price = { $lte: Number(maxPrice) };
  }

  let products = await Product.find(filter)
    .populate("shop", "name slug city deliveryZones isVerified status")
    .limit(30)
    .sort({ featuredUntil: -1, soldCount: -1 });

  products = products.filter((p) => p.shop && p.shop.status === "active");

  if (city && city.trim()) {
    const cityLower = city.trim().toLowerCase();
    products = products.filter((p) => {
      const shopCity = (p.shop.city || "").toLowerCase();
      const zones = (p.shop.deliveryZones || []).map((z) => (z.city || "").toLowerCase());
      return shopCity.includes(cityLower) || zones.some((z) => z.includes(cityLower));
    });
  }

  products = products.slice(0, 6);

  return products.map((p) => ({
    id: p._id.toString(),
    slug: p.slug || p._id.toString(),
    name: p.name,
    price: p.price,
    unit: p.unit,
    image: p.images?.[0] || "",
    shopName: p.shop.name,
    shopSlug: p.shop.slug,
    shopVerified: p.shop.isVerified,
  }));
}

const tools = [{ functionDeclarations: [searchProductsDeclaration] }];

// @route   POST /api/assistant/chat
// @access  Public
const handleChat = asyncHandler(async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ message: "Assistant non configuré." });
  }

  const { message, history } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Message requis." });
  }

  const contents = (Array.isArray(history) ? history : []).map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.content }],
  }));
  contents.push({ role: "user", parts: [{ text: message }] });

  let collectedProducts = [];
  let finalText = "";

  for (let step = 0; step < 3; step++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools,
      },
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const functionCall = parts.find((p) => p.functionCall)?.functionCall;

    if (functionCall && functionCall.name === "search_products") {
      const results = await searchProducts(functionCall.args || {});
      collectedProducts = results;

      contents.push({ role: "model", parts: [{ functionCall }] });
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: "search_products",
              response: { results },
            },
          },
        ],
      });
      continue;
    }

    finalText = response.text || "Je n'ai pas bien compris, peux-tu reformuler ?";
    break;
  }

  res.json({ reply: finalText, products: collectedProducts });
});

module.exports = { handleChat };
