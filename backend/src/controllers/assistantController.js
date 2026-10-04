const asyncHandler = require("express-async-handler");
const { GoogleGenAI, Type } = require("@google/genai");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { notify } = require("../utils/notify");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-3.8-flash";

const SYSTEM_INSTRUCTION = `Tu es l'assistant d'achat de Shopyz, une marketplace multi-vendeurs au Benin.
Ton role : aider les utilisateurs a trouver rapidement des produits qui correspondent a ce qu'ils cherchent (type d'article, budget, ville de livraison).
Utilise toujours l'outil "search_products" pour chercher dans le vrai catalogue avant de repondre - ne invente jamais de produits ou de prix.
Reponds en francais, de facon chaleureuse et concise (2-4 phrases). Si des resultats sont trouves, resume-les brievement (l'utilisateur verra les fiches produits juste en dessous de ton message, donc ne reliste pas tous les details).
Si aucun resultat ne correspond, dis-le simplement et propose d'elargir la recherche (prix ou ville).
Si l'utilisateur veut negocier un prix sur un produit precis, utilise l'outil "negotiate_price".`;

const searchProductsDeclaration = {
  name: "search_products",
  description: "Recherche des produits dans le catalogue Shopyz par nom, prix maximum et ville de livraison.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Mots-cles du produit recherche, ex: 'jean', 'crampons'" },
      maxPrice: { type: Type.NUMBER, description: "Budget maximum en FCFA, si precise par l'utilisateur" },
      city: { type: Type.STRING, description: "Ville de livraison souhaitee, ex: 'Abomey-Calavi'" },
    },
    required: ["query"],
  },
};

const negotiatePriceDeclaration = {
  name: "negotiate_price",
  description: "Envoie une proposition de prix au vendeur d'un produit precis, via la messagerie Shopyz.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      productId: { type: Type.STRING, description: "L'id du produit concerne (recupere via search_products)" },
      offeredPrice: { type: Type.NUMBER, description: "Le prix propose par l'utilisateur, en FCFA" },
      note: { type: Type.STRING, description: "Precision optionnelle a ajouter au message, ex: quantite souhaitee" },
    },
    required: ["productId", "offeredPrice"],
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
    image: p.images && p.images[0] ? p.images[0] : "",
    shopName: p.shop.name,
    shopSlug: p.shop.slug,
    shopVerified: p.shop.isVerified,
  }));
}

async function negotiatePrice({ productId, offeredPrice, note }, user) {
  if (!user) {
    return { error: "login_required", message: "L'utilisateur doit se connecter pour envoyer une proposition de prix." };
  }

  const product = await Product.findById(productId).populate("shop");
  if (!product || !product.shop) {
    return { error: "not_found", message: "Produit introuvable." };
  }
  const shop = product.shop;

  let conversation = await Conversation.findOne({ type: "client_shop", client: user._id, shop: shop._id });
  if (!conversation) {
    conversation = await Conversation.create({ type: "client_shop", client: user._id, shop: shop._id });
  }

  const priceLabel = product.price.toLocaleString("fr-FR");
  const offerLabel = Number(offeredPrice).toLocaleString("fr-FR");
  let text = "Bonjour, je suis interesse(e) par \"" + product.name + "\" (prix actuel : " + priceLabel + " FCFA). ";
  text += "Seriez-vous d'accord pour " + offerLabel + " FCFA ?";
  if (note) text += " " + note;

  await Message.create({
    conversation: conversation._id,
    sender: user._id,
    senderRole: "client",
    kind: "text",
    text,
  });

  conversation.lastMessage = text.slice(0, 80);
  conversation.lastMessageAt = new Date();
  conversation.unreadForMerchant += 1;
  await conversation.save();

  await notify(shop.owner, "message", "Nouvelle proposition de prix", text.slice(0, 80), "/messages/c/" + conversation._id);

  return { success: true, conversationId: conversation._id.toString() };
}

const tools = [{ functionDeclarations: [searchProductsDeclaration, negotiatePriceDeclaration] }];

const handleChat = asyncHandler(async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ message: "Assistant non configure." });
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
  let negotiationConversationId = null;

  async function callGemini() {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await ai.models.generateContent({
          model: MODEL,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools,
          },
        });
      } catch (err) {
        lastError = err;
        const isOverloaded = err.message && (err.message.includes("UNAVAILABLE") || err.message.includes("503"));
        if (!isOverloaded || attempt === 2) throw err;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
    throw lastError;
  }

  for (let step = 0; step < 3; step++) {
    const response = await callGemini();

    const candidate = response.candidates && response.candidates[0];
    const parts = (candidate && candidate.content && candidate.content.parts) || [];
    const functionCallPart = parts.find((p) => p.functionCall);
    const functionCall = functionCallPart ? functionCallPart.functionCall : null;

    if (functionCall && functionCall.name === "search_products") {
      const results = await searchProducts(functionCall.args || {});
      collectedProducts = results;

      contents.push({ role: "model", parts: [{ functionCall }] });
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name: "search_products", response: { results } } }],
      });
      continue;
    }

    if (functionCall && functionCall.name === "negotiate_price") {
      const result = await negotiatePrice(functionCall.args || {}, req.user);
      if (result.success) negotiationConversationId = result.conversationId;

      contents.push({ role: "model", parts: [{ functionCall }] });
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name: "negotiate_price", response: result } }],
      });
      continue;
    }

    finalText = response.text || "Je n'ai pas bien compris, peux-tu reformuler ?";
    break;
  }

  res.json({ reply: finalText, products: collectedProducts, conversationId: negotiationConversationId });
});

module.exports = { handleChat };
