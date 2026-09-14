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

export default function Confidentialite() {
  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 6 }}>
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 24 }}>
          Cette politique explique quelles données Shopizzy collecte, pourquoi, et comment elles sont protégées.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card}>
            <h2 style={h2}>Données que nous collectons</h2>
            <p style={p}>
              Lors de la création de ton compte et de l'utilisation de Shopizzy, nous collectons :
              nom, numéro de téléphone, email (facultatif), adresse de livraison, ville, photo de
              profil (facultative). Pour les marchands : informations de la boutique, logo,
              localisation. Pour les commandes : détail des articles, adresse et téléphone de
              livraison, mode de paiement choisi, et photos de preuve de livraison / de paiement
              en espèces envoyées par le livreur.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>Paiements en ligne</h2>
            <p style={p}>
              Les paiements en ligne sont traités par notre partenaire Kkiapay. Shopizzy ne
              stocke jamais tes identifiants Mobile Money ni tes données de carte bancaire :
              seule une référence de transaction nous est transmise pour confirmer le paiement.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>Comment nous utilisons ces données</h2>
            <p style={p}>
              Ces informations servent à : gérer ton compte, traiter et livrer tes commandes,
              te mettre en relation avec la boutique et le livreur concernés, t'envoyer des
              notifications liées à tes commandes, et améliorer la plateforme. Nous ne vendons
              aucune donnée personnelle à des tiers.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>Partage des données</h2>
            <p style={p}>
              Ton nom, ton téléphone et ton adresse de livraison sont partagés uniquement avec
              la boutique et le livreur impliqués dans une commande précise, dans la mesure
              nécessaire pour livrer cette commande. Aucune autre boutique ni aucun autre
              utilisateur n'y a accès.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>Conservation et sécurité</h2>
            <p style={p}>
              Les données sont hébergées sur des infrastructures cloud sécurisées. Les mots de
              passe sont stockés de façon chiffrée et ne sont jamais accessibles en clair, y
              compris par notre équipe.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>Tes droits</h2>
            <p style={p}>
              Tu peux à tout moment demander l'accès, la correction ou la suppression de tes
              données personnelles en nous contactant via la page{" "}
              <a href="/contact" style={{ fontWeight: 700, textDecoration: "underline" }}>Nous contacter</a>.
            </p>
          </div>

          <div style={card}>
            <h2 style={h2}>Modifications de cette politique</h2>
            <p style={p}>
              Cette politique peut évoluer avec le développement de Shopizzy. Toute mise à jour
              importante te sera signalée directement sur la plateforme.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
