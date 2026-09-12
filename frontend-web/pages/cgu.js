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

export default function Cgu() {
  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 24 }}>
          Conditions générales d'utilisation
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card}>
            <h2 style={h2}>1. Objet</h2>
            <p style={p}>
              EasyShop est une plateforme de marketplace mettant en relation des vendeurs
              partenaires (boutiques, restaurants, supermarchés, grossistes, artisans) et des
              acheteurs au Bénin. L'utilisation de la plateforme implique l'acceptation pleine et
              entière des présentes conditions.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>2. Comptes utilisateurs</h2>
            <p style={p}>
              La création d'un compte (client, marchand ou livreur) nécessite des informations
              exactes et à jour. Chaque utilisateur est responsable de la confidentialité de ses
              identifiants et de toute activité effectuée depuis son compte.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>3. Rôle et responsabilités des marchands</h2>
            <p style={p}>
              Chaque marchand est seul responsable de l'exactitude de ses fiches produits, de la
              conformité légale, de la qualité et de la disponibilité de ce qu'il propose à la
              vente. La vente de produits illicites, contrefaits ou dangereux est strictement
              interdite et entraîne la suspension immédiate du compte concerné. La création d'une
              boutique est soumise à validation par l'équipe EasyShop avant mise en ligne
              publique.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>4. Commandes et paiement</h2>
            <p style={p}>
              Une commande peut être réglée en ligne via Kkiapay (Mobile Money, carte) ou en
              espèces à la livraison, selon les options proposées. Une commission est prélevée
              par EasyShop sur chaque vente réalisée par un marchand ; son taux est indiqué au
              marchand dans son espace dédié et peut varier selon la catégorie de produit.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>5. Livraison</h2>
            <p style={p}>
              La livraison est organisée par le marchand, soit avec son propre livreur, soit en
              confiant la commande à un livreur du réseau EasyShop. EasyShop agit dans ce cas
              comme intermédiaire de mise en relation et ne garantit pas de délai de livraison
              précis, celui-ci dépendant de facteurs logistiques indépendants de la plateforme.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>6. Annulation, retours et litiges</h2>
            <p style={p}>
              Toute question relative à une commande (retard, article manquant ou non conforme)
              doit d'abord être adressée à la boutique concernée via la messagerie intégrée. En
              l'absence de résolution, l'utilisateur peut solliciter le support EasyShop, qui
              interviendra en tant que médiateur entre les parties.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>7. Limitation de responsabilité</h2>
            <p style={p}>
              EasyShop met tout en œuvre pour assurer le bon fonctionnement de la plateforme,
              mais n'est pas responsable de la qualité intrinsèque des produits vendus par les
              marchands tiers, ni des retards ou incidents imputables à un livreur indépendant.
              La responsabilité d'EasyShop se limite à son rôle d'intermédiaire technique entre
              les utilisateurs.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>8. Suspension de compte</h2>
            <p style={p}>
              EasyShop se réserve le droit de suspendre ou supprimer tout compte ne respectant
              pas les présentes conditions, notamment en cas de fraude, de non-respect des
              obligations légales, ou de comportement nuisible envers d'autres utilisateurs.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>9. Droit applicable</h2>
            <p style={p}>
              Les présentes conditions sont régies par le droit béninois. En cas de litige, les
              parties s'efforceront de trouver une solution amiable avant tout recours
              contentieux.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
