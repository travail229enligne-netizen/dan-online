import Header from "../components/Header";

const faqs = [
  {
    q: "Comment fonctionne EasyShop ?",
    a: "EasyShop est une marketplace qui réunit des boutiques, restaurants, supermarchés, grossistes et artisans partenaires au Bénin. Tu parcours les produits, tu commandes, et la boutique concernée prépare et organise la livraison chez toi.",
  },
  {
    q: "Comment puis-je payer ma commande ?",
    a: "Deux options selon la boutique et la commande : le paiement en ligne via Kkiapay (Mobile Money, carte) avant la livraison, ou le paiement en espèces à la livraison (le livreur encaisse directement).",
  },
  {
    q: "Qui livre ma commande ?",
    a: "Chaque boutique organise sa livraison, soit avec son propre livreur, soit en confiant la course à un livreur du réseau EasyShop. Dans les deux cas, tu peux suivre l'avancement et échanger directement avec le livreur via la messagerie.",
  },
  {
    q: "Que faire si je ne reçois pas ma commande ou si un article ne correspond pas ?",
    a: "Contacte directement la boutique via la messagerie intégrée à ta commande. Si le problème persiste, notre équipe support peut intervenir — voir la page Nous contacter.",
  },
  {
    q: "Comment devenir marchand sur EasyShop ?",
    a: "Crée un compte, choisis « Je suis marchand » lors de l'inscription, puis renseigne les informations de ta boutique (nom, catégorie, localisation, type de commerce). Ta boutique est vérifiée par notre équipe avant d'être visible publiquement.",
  },
  {
    q: "EasyShop prend-il une commission sur les ventes ?",
    a: "Oui, une commission est appliquée sur chaque vente réalisée par une boutique partenaire. Le taux dépend de la catégorie de produit et peut varier ; il est toujours indiqué au marchand dans son tableau de bord.",
  },
  {
    q: "Comment un marchand reçoit-il ses paiements ?",
    a: "Les revenus d'une boutique s'accumulent dans son portefeuille EasyShop au fur et à mesure des commandes livrées et payées. Le marchand peut ensuite demander un retrait vers son compte Mobile Money.",
  },
  {
    q: "Puis-je suivre une boutique que j'aime ?",
    a: "Oui, chaque boutique dispose d'un bouton « Suivre ». Tu seras notifié lorsqu'elle publie un nouveau produit.",
  },
  {
    q: "Mes données personnelles sont-elles protégées ?",
    a: "Oui, consulte notre Politique de confidentialité pour savoir précisément quelles données sont collectées et comment elles sont utilisées.",
  },
  {
    q: "Je n'ai pas trouvé la réponse à ma question, que faire ?",
    a: "N'hésite pas à nous contacter directement — voir la page Nous contacter / Support.",
  },
];

export default function Faq() {
  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 6 }}>
          Foire aux questions
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 24 }}>
          Les réponses aux questions les plus fréquentes sur EasyShop.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((item, i) => (
            <details
              key={i}
              style={{
                background: "var(--white)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-md)",
                padding: 16,
                boxSizing: "border-box",
              }}
            >
              <summary style={{ fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                {item.q}
              </summary>
              <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 10, marginBottom: 0, lineHeight: 1.6 }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </main>
    </>
  );
}
