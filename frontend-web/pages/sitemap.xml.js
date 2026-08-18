import api from "../lib/api";

const BASE_URL = "https://dan-online.vercel.app";

function generateSiteMap(shops, products) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/recherche</loc>
    <priority>0.6</priority>
  </url>
  ${shops
    .map(
      (shop) => `<url>
    <loc>${BASE_URL}/boutique/${shop.slug}</loc>
    <priority>0.8</priority>
  </url>`
    )
    .join("\n  ")}
  ${products
    .map(
      (p) => `<url>
    <loc>${BASE_URL}/produit/${p._id}</loc>
    <priority>0.7</priority>
  </url>`
    )
    .join("\n  ")}
</urlset>`;
}

export default function SiteMap() {
  return null;
}

export async function getServerSideProps({ res }) {
  let shops = [];
  let products = [];
  try {
    const shopsRes = await api.get("/shops");
    shops = shopsRes.data;
    const productsRes = await api.get("/products?limit=200");
    products = productsRes.data.products;
  } catch {
    // en cas d'erreur, on renvoie un sitemap minimal plutot que de planter
  }

  const sitemap = generateSiteMap(shops, products);

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return { props: {} };
}
