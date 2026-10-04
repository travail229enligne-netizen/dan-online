import { useState, useEffect } from "react";
import api from "../lib/api";
import PromoBanner from "./PromoBanner";

export default function ShopPromoBanner({ slug }) {
  const [shop, setShop] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    api.get(`/shops/${slug}`).then((r) => { if (alive) setShop(r.data); }).catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  if (!shop?.popup?.enabled) return null;
  return <PromoBanner popup={shop.popup} shopId={shop._id} themeColor={shop.themeColor} href={`/boutique/${shop.slug || slug}`} />;
}
