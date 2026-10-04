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
    window.fbq("track", "PageView");
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
    window.ttq.page();
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

export function trackViewContent(pixels, info) {
  loadShopPixels(pixels);
  if (typeof window === "undefined" || !pixels) return;
  if (pixels.metaPixelId && window.fbq) {
    window.fbq("track", "ViewContent", { content_ids: [info.id], content_name: info.name, content_type: "product", value: info.price, currency: "XOF" });
  }
  if (pixels.tiktokPixelId && window.ttq) {
    window.ttq.track("ViewContent", { content_id: info.id, content_name: info.name, value: info.price, currency: "XOF" });
  }
}

export function trackAddToCart(pixels, info) {
  loadShopPixels(pixels);
  if (typeof window === "undefined" || !pixels) return;
  const value = info.price * (info.quantity || 1);
  if (pixels.metaPixelId && window.fbq) {
    window.fbq("track", "AddToCart", { content_ids: [info.id], content_name: info.name, content_type: "product", value, currency: "XOF" });
  }
  if (pixels.tiktokPixelId && window.ttq) {
    window.ttq.track("AddToCart", { content_id: info.id, content_name: info.name, value, currency: "XOF" });
  }
}

export function trackPurchase(pixels, info) {
  loadShopPixels(pixels);
  if (typeof window === "undefined" || !pixels) return;
  if (pixels.metaPixelId && window.fbq) {
    window.fbq("track", "Purchase", { value: info.value, currency: "XOF", content_type: "product" });
  }
  if (pixels.tiktokPixelId && window.ttq) {
    window.ttq.track("CompletePayment", { value: info.value, currency: "XOF" });
  }
  if (pixels.googleAdsId && window.gtag) {
    window.gtag("event", "conversion", { send_to: pixels.googleAdsId, value: info.value, currency: "XOF", transaction_id: info.orderId });
  }
}
