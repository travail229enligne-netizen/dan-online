import MerchantLayout from "../../components/MerchantLayout";

export default function GuideMarchand() {
  return (
    <MerchantLayout title="Guide complet">
      <div style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 40 }}>
        <h1 style={{ fontSize: 22, color: "var(--ink)", marginBottom: 6 }}>
          Guide du marchand Shopyz
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 28, lineHeight: 1.6 }}>
          De la création de ta boutique jusqu'à tes premiers revenus, voici toutes les étapes pour
          bien démarrer sur Shopyz.
        </p>

        <Step number="1" title="Créer sa boutique">
          Rends-toi dans "Créer ma boutique" depuis ton tableau de bord. Renseigne le nom de ta
          boutique, une photo de couverture, un logo, une courte description qui donne envie, et
          choisis la catégorie qui correspond le mieux à ton activité (mode, alimentation,
          artisanat, etc.). Une boutique avec des informations complètes inspire plus confiance
          aux clients.
        </Step>

        <Step number="2" title="Ajouter ses premiers produits">
          Depuis ton tableau de bord, clique sur "Ajouter un produit". Pour chaque produit,
          ajoute : au moins une photo nette et bien éclairée, un nom clair, une description
          précise, un prix, et la quantité disponible en stock. Plus tes fiches produits sont
          soignées, plus les clients achètent en confiance.
        </Step>

        <Step number="3" title="Configurer tes zones de livraison">
          Dans les paramètres de ta boutique, définis les villes ou quartiers où tu livres, ainsi
          que le prix de livraison pour chaque zone. Cela permet à tes clients de connaître les
          frais exacts avant de commander.
        </Step>

        <Step number="4" title="Ajouter un livreur (optionnel)">
          Si tu ne livres pas toi-même, tu peux ajouter un livreur depuis "Mes livreurs" en
          renseignant simplement son numéro de téléphone. Il recevra automatiquement les
          commandes à livrer et pourra confirmer sa disponibilité.
        </Step>

        <Step number="5" title="Recevoir et gérer les commandes">
          Chaque nouvelle commande apparaît dans "Mes commandes". Confirme-la rapidement pour
          rassurer le client, prépare le produit, puis assigne-la à un livreur (ou livre-la
          toi-même). Une fois la livraison confirmée avec une preuve (photo), la commande passe
          en "Livrée".
        </Step>

        <Step number="6" title="Encaisser et suivre ton portefeuille">
          Pour les paiements en espèces, tu encaisses directement auprès du client. Pour les
          paiements Mobile Money, le montant est prélevé automatiquement après confirmation de la
          livraison. Tu peux suivre tous tes gains dans "Mon portefeuille" et demander un retrait
          quand tu le souhaites.
        </Step>

        <Step number="7" title="Répondre à tes clients">
          Utilise la messagerie intégrée pour répondre rapidement aux questions des clients avant
          et après l'achat. Une boutique réactive génère plus de ventes et de meilleurs avis.
        </Step>

        <Step number="8" title="Mettre en avant ta boutique ou tes produits">
          Pour gagner en visibilité, tu peux mettre en avant ta boutique (1000 FCFA/jour) ou un
          produit précis (300 FCFA/jour) pour une durée de 3, 7, 15 ou 30 jours. Le paiement se
          fait directement via Mobile Money et l'activation est immédiate.
        </Step>

        <Step number="9" title="Générer tes premiers revenus">
          Pour vendre rapidement : publie au moins 5 à 10 produits avec de bonnes photos, fixe des
          prix compétitifs, réponds vite aux messages, honore chaque commande dans les délais, et
          utilise la mise en avant pendant les premiers jours pour te faire connaître. La
          régularité et le sérieux sont les meilleurs leviers pour construire une bonne réputation
          sur Shopyz.
        </Step>

        <div
          style={{
            background: "var(--cream)",
            borderRadius: 10,
            padding: 16,
            marginTop: 8,
            fontSize: 13,
            color: "var(--ink-soft)",
            lineHeight: 1.6,
          }}
        >
          💡 Tu peux retrouver ce guide à tout moment depuis le menu, dans la section marchand.
        </div>
      </div>
    </MerchantLayout>
  );
}

function Step({ number, title, children }) {
  return (
    <section style={{ display: "flex", gap: 14, marginBottom: 22 }}>
      <div
        style={{
          minWidth: 30,
          height: 30,
          borderRadius: "50%",
          background: "var(--ink)",
          color: "var(--white)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        {number}
      </div>
      <div>
        <h2 style={{ fontSize: 15, color: "var(--ink)", marginBottom: 6, fontWeight: 700 }}>
          {title}
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7 }}>{children}</p>
      </div>
    </section>
  );
}
