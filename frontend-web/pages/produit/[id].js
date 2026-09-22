import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../../components/Header";
import api from "../../lib/api";
import { useCart } from "../../lib/cart";
import { useAuth } from "../../lib/auth";

function priceForQty(product, qty) {
  if (!product.priceTiers || product.priceTiers.length === 0) return product.price;
  const applicable = product.priceTiers
    .filter((t) => qty >= t.minQty)
    .sort((a, b) => b.minQty - a.minQty);
  return applicable.length > 0 ? applicable[0].price : product.price;
}

export default function ProduitDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(undefined);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState("1");
  const [added, setAdded] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});

  useEffect(() => {
    if (!id) return;
    api.get(`/products/${id}`).then((r) => {
      setProduct(r.data);
      // Pre-selectionne la premiere option de chaque groupe de variantes
      if (r.data.variantGroups && r.data.variantGroups.length > 0) {
        const defaults = {};
        r.data.variantGroups.forEach((g) => {
          if (g.options.length > 0) defaults[g.name] = g.options[0].label;
        });
        setSelectedVariants(defaults);
      }
    }).catch(() => setProduct(null));
  }, [id]);

  const images = product && product.images && product.images.length > 0 ? product.images : [null];

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImage((i) => (i + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Cherche, parmi les groupes de variantes, la premiere option choisie qui a
  // un prix defini : ce prix remplace alors le prix de base/paliers du produit.
  const getVariantOverridePrice = () => {
    if (!product?.variantGroups) return null;
    for (const group of product.variantGroups) {
      const chosenLabel = selectedVariants[group.name];
      const option = group.options.find((o) => o.label === chosenLabel);
      if (option && option.price !== null && option.price !== undefined) {
        return option.price;
      }
    }
    return null;
  };

  const getVariantSummary = () => {
    if (!product?.variantGroups || product.variantGroups.length === 0) return "";
    return product.variantGroups
      .map((g) => selectedVariants[g.name])
      .filter(Boolean)
      .join(", ");
  };

  const handleNegotiate = () => {
    if (!user) {
      router.push(`/connexion?next=/produit/${id}`);
      return;
    }
    router.push(
      `/messages/${product.shop._id}?produit=${encodeURIComponent(product.name)}&prix=${unitPrice}`
    );
  };

  if (product === undefined) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40 }}>
          <p style={{ color: "var(--ink-soft)" }}>Chargement...</p>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Produit introuvable.</p>
        </main>
      </>
    );
  }

  const numericQty = Math.max(1, Number(qty) || 1);
  const variantOverride = getVariantOverridePrice();
  const unitPrice = variantOverride !== null ? variantOverride : priceForQty(product, numericQty);
  const total = unitPrice * numericQty;
  const variantSummary = getVariantSummary();

  const pageTitle = `${product.name} - ${product.price?.toLocaleString("fr-FR")} FCFA | Shopyz`;
  const pageDescription = product.description
    ? product.description.slice(0, 155)
    : `Achetez ${product.name} sur Shopyz, la marketplace du Bénin. Livraison rapide, paiement à la livraison.`;
  const pageImage = product.images?.[0] || "";
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {pageImage && <meta property="og:image" content={pageImage} />}
        <meta property="og:type" content="product" />
        {pageUrl && <link rel="canonical" href={pageUrl} />}
      </Head>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <div
          style={{
            height: 280,
            borderRadius: "var(--radius-md)",
            background: images[activeImage]
              ? `#eee url(${images[activeImage]}) center/cover no-repeat`
              : "#eee",
            marginBottom: 10,
            transition: "background-image 0.3s ease",
          }}
        />

        {images.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto" }}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                style={{
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                  borderRadius: 8,
                  border: i === activeImage ? "2px solid var(--ink)" : "1px solid var(--line)",
                  background: img ? `#eee url(${img}) center/cover no-repeat` : "#eee",
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}

        <h1 style={{ fontSize: 20, marginBottom: 6 }}>{product.name}</h1>
        {product.shop?.name && (
          <a href={`/boutique/${product.shop.slug}`} style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Vendu par {product.shop.name}
          </a>
        )}

        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--terracotta-dark)", margin: "14px 0 4px" }}>
          {unitPrice.toLocaleString("fr-FR")} FCFA
          <span style={{ fontSize: 13, fontWeight: 400, color: "var(--ink-soft)" }}> / {product.unit}</span>
        </div>

        {numericQty > 1 && (
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>
            Total pour {numericQty} {product.unit} : <strong style={{ color: "var(--ink)" }}>{total.toLocaleString("fr-FR")} FCFA</strong>
          </p>
        )}

        {product.variantGroups && product.variantGroups.length > 0 && (
          <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {product.variantGroups.map((group) => (
              <div key={group.name}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{group.name}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {group.options.map((opt) => {
                    const active = selectedVariants[group.name] === opt.label;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedVariants({ ...selectedVariants, [group.name]: opt.label })}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 20,
                          border: `2px solid ${active ? "var(--terracotta)" : "var(--line)"}`,
                          background: active ? "var(--terracotta)" : "var(--white)",
                          color: active ? "var(--white)" : "var(--ink)",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {opt.label}
                        {opt.price !== null && opt.price !== undefined && (
                          <span style={{ opacity: 0.8, fontWeight: 400 }}> — {opt.price.toLocaleString("fr-FR")} FCFA</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {product.priceTiers && product.priceTiers.length > 0 && (
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              padding: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Prix par quantité</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-soft)", padding: "3px 0" }}>
              <span>1 - {product.priceTiers[0].minQty - 1} {product.unit}</span>
              <span>{product.price.toLocaleString("fr-FR")} FCFA/{product.unit}</span>
            </div>
            {product.priceTiers.map((tier, i) => {
              const next = product.priceTiers[i + 1];
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-soft)", padding: "3px 0" }}>
                  <span>
                    {tier.minQty}{next ? ` - ${next.minQty - 1}` : "+"} {product.unit}
                  </span>
                  <span>{tier.price.toLocaleString("fr-FR")} FCFA/{product.unit}</span>
                </div>
              );
            })}
          </div>
        )}

        {product.stock === 0 ? (
          <p style={{ fontSize: 13, color: "var(--terracotta-dark)", fontWeight: 600, marginBottom: 16 }}>
            Rupture de stock
          </p>
        ) : (
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>
            {product.stock} {product.unit} disponibles
          </p>
        )}

        {product.description && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, marginBottom: 6 }}>Description</h2>
            <p style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.6 }}>{product.description}</p>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <label style={{ fontSize: 13 }}>Quantité</label>
          <input
            type="number"
            min={1}
            max={product.stock}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onBlur={() => setQty((v) => String(Math.max(1, Number(v) || 1)))}
            style={{ width: 70, padding: 8, border: "1px solid var(--line)", borderRadius: 8 }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={handleNegotiate}
            style={{
              flex: 1,
              padding: 14,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 14,
              border: "1px solid var(--line)",
              background: "var(--white)",
              color: "var(--ink)",
            }}
          >
            💬 Négocier
          </button>
          <button
            className="btn-primary"
            style={{ flex: 2, padding: 14, fontSize: 15 }}
            disabled={product.stock === 0}
            onClick={() => {
              const displayName = variantSummary ? `${product.name} (${variantSummary})` : product.name;
              addToCart({ ...product, name: displayName, price: unitPrice }, numericQty);
              setAdded(true);
              setTimeout(() => setAdded(false), 2000);
            }}
          >
            {product.stock === 0 ? "Indisponible" : added ? "Ajouté !" : "Ajouter au panier"}
          </button>
        </div>
      </main>
    </>
  );
}
