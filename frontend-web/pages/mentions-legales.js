import Header from "../components/Header";

const card = {
  background: "var(--white)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-md)",
  padding: 18,
  boxSizing: "border-box",
};

const h2 = { fontSize: 16, marginBottom: 10 };
const p = { fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 };

export default function MentionsLegales() {
  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 24 }}>
          Mentions légales
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card}>
            <h2 style={h2}>Éditeur du site</h2>
            <p style={p}>
              La plateforme Shopizzy est exploitée par une entreprise établie à Cotonou, Bénin.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>Contact</h2>
            <p style={p}>
              Téléphone / WhatsApp : 0148420090 — 0196698874.<br />
              Voir la page <a href="/contact" style={{ fontWeight: 700, textDecoration: "underline" }}>Nous contacter</a> pour tous les moyens de nous joindre.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>Hébergement</h2>
            <p style={p}>
              Le site et l'application Shopizzy sont hébergés par des prestataires cloud tiers
              (hébergement du site web, de l'application serveur et de la base de données),
              ainsi que par un service de gestion des paiements en ligne (Kkiapay) pour les
              transactions Mobile Money et carte bancaire.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>Nature de l'activité</h2>
            <p style={p}>
              Shopizzy est une plateforme de marketplace qui met en relation des vendeurs
              (boutiques, restaurants, supermarchés, grossistes, artisans) et des acheteurs au
              Bénin. Sauf mention contraire, Shopizzy n'est pas elle-même vendeuse des produits
              proposés sur la plateforme : chaque boutique partenaire reste responsable de son
              catalogue, de ses prix et de la conformité de ses produits.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>Propriété intellectuelle</h2>
            <p style={p}>
              Le nom « Shopizzy », son logo, ainsi que l'ensemble des éléments graphiques et
              techniques du site (hors contenus publiés par les boutiques partenaires) sont la
              propriété d'Shopizzy. Toute reproduction non autorisée est interdite.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
