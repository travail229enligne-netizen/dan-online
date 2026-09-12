import Header from "../components/Header";

const phones = [
  { label: "0148420090", tel: "0148420090" },
  { label: "0196698874", tel: "0196698874" },
];

const card = {
  background: "var(--white)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-md)",
  padding: 18,
  boxSizing: "border-box",
};

export default function Contact() {
  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 6 }}>
          Nous contacter
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 24 }}>
          Une question, un souci avec une commande, ou besoin d'aide pour ta boutique ? Notre équipe support
          est disponible pour t'aider.
        </p>

        <div style={{ ...card, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 14 }}>Par téléphone ou WhatsApp</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {phones.map((p) => (
              <div key={p.tel} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{p.label}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={`tel:${p.tel}`}
                    style={{ fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--line)", color: "var(--ink)" }}
                  >
                    📞 Appeler
                  </a>
                  <a
                    href={`https://wa.me/229${p.tel.replace(/^0/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 10, background: "var(--ink)", color: "var(--white)" }}
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 16, marginBottom: 10 }}>Avant de nous écrire</h2>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 10 }}>
            Pour un problème lié à une commande précise (retard, article manquant, litige avec une boutique),
            le plus rapide est d'utiliser la messagerie intégrée à ta commande — la boutique ou le livreur
            concerné pourra te répondre directement.
          </p>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
            Pour toute autre question, consulte d'abord notre <a href="/faq" style={{ fontWeight: 700, textDecoration: "underline" }}>FAQ</a>,
            ou contacte-nous directement via les moyens ci-dessus.
          </p>
        </div>
      </main>
    </>
  );
}
