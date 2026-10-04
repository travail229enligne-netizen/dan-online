const loadedMeta = new Set();
const loadedTikTok = new Set();
const loadedGoogle = new Set();

function ensureMetaBase() {
  if (typeof window === "undefined" || window.fbq) return;
  window.fbq = function () {
    window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
  };
  window.fbq.push = window.fbq;
  window.fbq.loaded = true;
  window.fbq.version = "2.0";
  window.fbq.queue = [];
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

function loadMetaPixel(pixelId) {
  if (!pixelId || typeof window === "undefined") return;
  ensureMetaBase();
  if (!loadedMeta.has(pixelId)) {
    window.fbq("init", pixelId);
    window.fbq("trackSingle", pixelId, "PageView");
    loadedMeta.add(pixelId);
  }
}

function ensureTikTokBase() {
  if (typeof window === "undefined" || window.ttq) return;
  (function (w, d, t) {
    w.TiktokAnalyticsObject = t;
    var ttq = (w[t] = w[t] || []);
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
    ttq.setAndDefer = function (tq, ev) {
      tq[ev] = function () {
        tq.push([ev].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (id) {
      var inst = ttq._i[id] || [];
      for (var k = 0; k < ttq.methods.length; k++) ttq.setAndDefer(inst, ttq.methods[k]);
      return inst;
    };
    ttq.load = function (pid) {
      var src = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[pid] = [];
      var s = document.createElement("script");
      s.type = "text/javascript";
      s.async = true;
      s.src = src + "?sdkid=" + pid + "&lib=" + t;
      var firstScript = document.getElementsByTagName("script")[0];
      firstScript.parentNode.insertBefore(s, firstScript);
    };
  })(window, document, "ttq");
}

function loadTikTokPixel(pixelId) {
  if (!pixelId || typeof window === "undefined") return;
  ensureTikTokBase();
  if (!loadedTikTok.has(pixelId)) {
    window.ttq.load(pixelId);
    window.ttq.instance(pixelId).page();
    loadedTikTok.add(pixelId);
  }
}

function loadGoogleAds(conversionId) {
  if (!conversionId || typeof window === "undefined" || loadedGoogle.has(conversionId)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + conversionId;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", conversionId);
  loadedGoogle.add(conversionId);
}

export function loadShopPixels(pixels) {
  if (!pixels) return;
  if (pixels.metaPixelId) loadMetaPixel(pixels.metaPixelId);
  if (pixels.tiktokPixelId) loadTikTokPixel(pixels.tiktokPixelId);
  if (pixels.googleAdsId) loadGoogleAds(pixels.googleAdsId);
}

// Envoie l'événement uniquement au pixel de CETTE boutique
function metaTrack(pixelId, event, data, eventId) {
  if (!pixelId || typeof window === "undefined" || !window.fbq) return;
  if (eventId) window.fbq("trackSingle", pixelId, event, data, { eventID: eventId });
  else window.fbq("trackSingle", pixelId, event, data);
}

function ttTrack(pixelId, event, data, eventId) {
  if (!pixelId || typeof window === "undefined" || !window.ttq) return;
  const t = window.ttq.instance ? window.ttq.instance(pixelId) : window.ttq;
  if (eventId) t.track(event, data, { event_id: eventId });
  else t.track(event, data);
}

function getCookie(name) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

// Données du navigateur utiles à l'API de conversion (envoyées avec la commande)
export function getTrackingContext() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  let fbc = getCookie("_fbc");
  const fbclid = params.get("fbclid");
  if (!fbc && fbclid) fbc = "fb.1." + Date.now() + "." + fbclid;
  return {
    fbp: getCookie("_fbp"),
    fbc,
    ttp: getCookie("_ttp"),
    ttclid: params.get("ttclid") || "",
    sourceUrl: window.location.href,
  };
}

export function trackViewContent(pixels, info) {
  loadShopPixels(pixels);
  if (typeof window === "undefined" || !pixels) return;
  metaTrack(pixels.metaPixelId, "ViewContent", { content_ids: [info.id], content_name: info.name, content_type: "product", value: info.price, currency: "XOF" });
  ttTrack(pixels.tiktokPixelId, "ViewContent", { content_id: info.id, content_name: info.name, value: info.price, currency: "XOF" });
}

export function trackAddToCart(pixels, info) {
  loadShopPixels(pixels);
  if (typeof window === "undefined" || !pixels) return;
  const value = info.price * (info.quantity || 1);
  metaTrack(pixels.metaPixelId, "AddToCart", { content_ids: [info.id], content_name: info.name, content_type: "product", value, currency: "XOF" });
  ttTrack(pixels.tiktokPixelId, "AddToCart", { content_id: info.id, content_name: info.name, value, currency: "XOF" });
}

export function trackPurchase(pixels, info) {
  loadShopPixels(pixels);
  if (typeof window === "undefined" || !pixels) return;
  const contents = info.contents || [];
  const eventId = info.orderId && info.shopId ? "purchase_" + info.orderId + "_" + info.shopId : undefined;
  metaTrack(
    pixels.metaPixelId,
    "Purchase",
    {
      value: info.value,
      currency: "XOF",
      content_type: "product",
      content_ids: contents.map((c) => c.id),
      contents: contents.map((c) => ({ id: c.id, quantity: c.quantity, item_price: c.item_price })),
      order_id: info.orderId,
    },
    eventId
  );
  ttTrack(
    pixels.tiktokPixelId,
    "CompletePayment",
    {
      value: info.value,
      currency: "XOF",
      content_type: "product",
      contents: contents.map((c) => ({ content_id: c.id, quantity: c.quantity, price: c.item_price })),
      order_id: info.orderId,
    },
    eventId
  );
  if (pixels.googleAdsId && window.gtag) {
    window.gtag("event", "conversion", { send_to: pixels.googleAdsId, value: info.value, currency: "XOF", transaction_id: info.orderId });
  }
}
