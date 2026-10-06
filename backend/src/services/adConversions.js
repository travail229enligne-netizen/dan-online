const crypto = require("crypto");
const axios = require("axios");
const Shop = require("../models/Shop");

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v26.0";
const TIKTOK_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

const sha256 = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");

// Numéros du Bénin : on ajoute l'indicatif 229 s'il manque
function phoneDigits(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("229") ? d : "229" + d;
}

function logError(label, shopId, err) {
  const msg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || "erreur";
  console.error(`[adConversions] ${label} boutique ${shopId}: ${msg}`);
}

async function sendMeta({ pixelId, token, testCode, eventId, eventTime, user, custom, sourceUrl }) {
  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: eventTime,
        event_id: eventId,
        action_source: "website",
        ...(sourceUrl ? { event_source_url: sourceUrl } : {}),
        user_data: user,
        custom_data: custom,
      },
    ],
  };
  if (testCode) body.test_event_code = testCode;
  await axios.post(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`, body, {
    params: { access_token: token },
    timeout: 8000,
  });
}

async function sendTikTok({ pixelId, token, testCode, eventId, eventTime, user, properties, sourceUrl }) {
  const body = {
    event_source: "web",
    event_source_id: pixelId,
    ...(testCode ? { test_event_code: testCode } : {}),
    data: [
      {
        event: "CompletePayment",
        event_time: eventTime,
        event_id: eventId,
        user,
        properties,
        ...(sourceUrl ? { page: { url: sourceUrl } } : {}),
      },
    ],
  };
  await axios.post(TIKTOK_URL, body, {
    headers: { "Access-Token": token, "Content-Type": "application/json" },
    timeout: 8000,
  });
}

async function sendOrderConversions({ order, shopIds, client, tracking, ip, userAgent }) {
  try {
    const t = tracking && typeof tracking === "object" ? tracking : {};
    const shops = await Shop.find({ _id: { $in: shopIds } }).select(
      "pixels +adApi.metaToken +adApi.metaTestCode +adApi.tiktokToken +adApi.tiktokTestCode"
    );
    const eventTime = Math.floor(Date.now() / 1000);
    const phone = phoneDigits(order.deliveryPhone);
    const email = String(client?.email || "").trim().toLowerCase();
    const sourceUrl = /^https?:\/\//.test(String(t.sourceUrl || "")) ? String(t.sourceUrl).slice(0, 500) : "";

    const metaUser = {
      ...(email ? { em: [sha256(email)] } : {}),
      ...(phone ? { ph: [sha256(phone)] } : {}),
      country: [sha256("bj")],
      external_id: [sha256(String(order.client))],
      ...(ip ? { client_ip_address: ip } : {}),
      ...(userAgent ? { client_user_agent: userAgent } : {}),
      ...(t.fbp ? { fbp: String(t.fbp).slice(0, 200) } : {}),
      ...(t.fbc ? { fbc: String(t.fbc).slice(0, 300) } : {}),
    };
    const ttUser = {
      ...(email ? { email: sha256(email) } : {}),
      ...(phone ? { phone: sha256("+" + phone) } : {}),
      external_id: sha256(String(order.client)),
      ...(ip ? { ip } : {}),
      ...(userAgent ? { user_agent: userAgent } : {}),
      ...(t.ttp ? { ttp: String(t.ttp).slice(0, 200) } : {}),
      ...(t.ttclid ? { ttclid: String(t.ttclid).slice(0, 300) } : {}),
    };

    const tasks = [];
    for (const shop of shops) {
      const shopId = String(shop._id);
      const items = order.items.filter((it) => String(it.shop) === shopId);
      if (!items.length) continue;
      const value = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const contents = items.map((it) => ({ id: String(it.product), quantity: it.quantity, item_price: it.price }));
      const eventId = `purchase_${order._id}_${shopId}`;
      const a = shop.adApi || {};
      const px = shop.pixels || {};

      if (px.metaPixelId && a.metaToken) {
        tasks.push(
          sendMeta({
            pixelId: px.metaPixelId,
            token: a.metaToken,
            testCode: a.metaTestCode,
            eventId,
            eventTime,
            user: metaUser,
            sourceUrl,
            custom: {
              currency: "XOF",
              value,
              content_type: "product",
              content_ids: contents.map((c) => c.id),
              contents,
              num_items: items.reduce((n, it) => n + it.quantity, 0),
              order_id: String(order._id),
            },
          }).catch((e) => logError("meta", shopId, e))
        );
      }
      if (px.tiktokPixelId && a.tiktokToken) {
        tasks.push(
          sendTikTok({
            pixelId: px.tiktokPixelId,
            token: a.tiktokToken,
            testCode: a.tiktokTestCode,
            eventId,
            eventTime,
            user: ttUser,
            sourceUrl,
            properties: {
              currency: "USD",
              value: xofToUsd(value),
              content_type: "product",
              contents: contents.map((c) => ({ content_id: c.id, quantity: c.quantity, price: xofToUsd(c.item_price) })),
              order_id: String(order._id),
            },
          }).catch((e) => logError("tiktok", shopId, e))
        );
      }
    }
    await Promise.all(tasks);
  } catch (e) {
    console.error("[adConversions]", e.message);
  }
}

module.exports = { sendOrderConversions };
