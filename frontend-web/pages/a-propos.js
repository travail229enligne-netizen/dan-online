import Header from "../components/Header";

const card = {
  background: "var(--white)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-md)",
  padding: 18,
  boxSizing: "border-box",
};

export default function APropos() {
  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 6 }}>
          À propos de Shopizzy
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 24 }}>
          Tout ce qui se vend, à portée de main.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card}>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>Notre mission</h2>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
              Shopizzy est né d'une idée simple : rassembler la richesse et la diversité des marchés béninois,
              à l'image du grand marché de Dantokpa, sur une seule plateforme en ligne. Boutiques, restaurants,
              supermarchés, grossistes et artisans y proposent leurs produits, comparables, commandables et
              livrables en toute simplicité.
            </p>
          </div>

          <div style={card}>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>Comment ça marche</h2>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
              Chaque vendeur reste maître de sa boutique : ses produits, ses prix, ses conditions de livraison.
              Shopizzy fournit l'outil — recherche, paiement en ligne ou en espèces, messagerie, suivi de
              commande — et s'assure que chaque boutique partenaire est vérifiée avant sa mise en ligne.
            </p>
          </div>

          <div style={card}>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>Notre ambition</h2>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
              Nous démarrons à Cotonou et dans les grandes villes du Bénin, avec la volonté de nous étendre
              progressivement à l'ensemble du pays puis à l'Afrique de l'Ouest — en gardant toujours la même
              exigence : qualité, confiance, et simplicité pour chaque acheteur comme pour chaque vendeur.
            </p>
          </div>

          <div style={card}>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>Une question ?</h2>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
              N'hésite pas à consulter notre <a href="/faq" style={{ fontWeight: 700, textDecoration: "underline" }}>FAQ</a> ou
              à <a href="/contact" style={{ fontWeight: 700, textDecoration: "underline" }}>nous contacter</a> directement.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
