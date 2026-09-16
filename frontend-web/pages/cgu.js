import Header from "../components/Header";

export default function CGU() {
  return (
    <>
      <Header hideSearchBar={true} />
      <main className="container" style={{ padding: "32px 16px", maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, color: "var(--ink)", marginBottom: 8 }}>
          Conditions Générales d'Utilisation
        </h1>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 24 }}>
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </p>

        <Section title="1. Objet">
          Les présentes Conditions Générales d'Utilisation (CGU) encadrent l'accès et l'utilisation
          de la plateforme Shopyz, une marketplace numérique mettant en relation des marchands
          (boutiques, restaurants, supermarchés, grossistes, artisans) et des clients pour l'achat
          et la vente de produits et services. En utilisant Shopyz, tout utilisateur (client ou
          marchand) accepte sans réserve les présentes CGU.
        </Section>

        <Section title="2. Acceptation obligatoire">
          L'accès aux fonctionnalités de Shopyz est conditionné à la lecture et à l'acceptation
          expresse des présentes CGU dès la première connexion. Tout utilisateur qui refuse ces
          conditions ne pourra pas utiliser la plateforme.
        </Section>

        <Section title="3. Produits et services interdits">
          Shopyz interdit strictement la vente de tout produit ou service illicite, contrefait,
          dangereux ou dont la commercialisation est prohibée par la législation béninoise et les
          conventions internationales applicables. Cela inclut notamment, sans s'y limiter : les
          armes, stupéfiants, médicaments non homologués, produits contrefaits, et tout bien ou
          service dont la vente constitue une infraction pénale. Tout marchand publiant un produit
          illicite verra son compte suspendu ou supprimé, sans préjudice des poursuites judiciaires
          applicables.
        </Section>

        <Section title="4. Exigence de transparence">
          Conformément à la loi n° 2017-20 du 20 avril 2018 portant Code du numérique en
          République du Bénin (livre quatrième, "Commerce électronique", articles 326 à 378), qui
          s'applique à toute commande, contrat ou transaction conclu en ligne, Shopyz exige de
          chaque marchand une transparence totale sur la description, le prix, la disponibilité et
          l'origine des produits ou services proposés. Toute information trompeuse ou mensongère
          constitue une violation des présentes CGU.
        </Section>

        <Section title="5. Règles de la plateforme">
          Les règles de Shopyz sont simples : vendre et acheter en toute sécurité, avec
          transparence. Chaque marchand s'engage à honorer les commandes acceptées, et chaque
          client s'engage à régler les commandes qu'il passe. Shopyz agit comme intermédiaire
          technique et n'est pas partie au contrat de vente conclu entre le marchand et le client.
        </Section>

        <Section title="6. Frais de plateforme et commissions">
          L'utilisation de Shopyz par les marchands pour vendre leurs produits est gratuite à
          l'inscription. En contrepartie, une commission est prélevée par Shopyz sur chaque vente
          réalisée via la plateforme, afin d'assurer la maintenance, l'hébergement, la sécurité et
          le développement continu du service. Ce prélèvement constitue la contrepartie
          contractuelle de l'accès à la plateforme et de ses services (visibilité, paiement,
          messagerie, logistique).
        </Section>

        <Section title="7. Interdiction de contournement des commissions">
          Toute tentative visant à détourner une vente initiée sur Shopyz afin d'éviter le
          prélèvement de la commission (par exemple en redirigeant un client vers une transaction
          hors plateforme après une mise en relation effectuée via Shopyz) constitue une violation
          grave des présentes CGU et de l'accord contractuel liant le marchand à la plateforme.
          Une telle manœuvre peut entraîner la suspension immédiate et définitive du compte
          marchand, ainsi que des poursuites judiciaires conformément à la loi n° 2017-20 portant
          Code du numérique en République du Bénin et, le cas échéant, à la Convention des Nations
          Unies sur l'utilisation de communications électroniques dans les contrats internationaux
          (New York, 2005), à laquelle le Bénin est partie.
        </Section>

        <Section title="8. Obligations du client — commandes et paiement">
          Tout client qui passe une commande sur Shopyz s'engage à la régler selon le mode de
          paiement choisi (espèces à la livraison ou Mobile Money). Le refus répété de payer une
          commande livrée, ou tout comportement visant à nuire au bon fonctionnement de la
          plateforme, peut entraîner des sanctions, y compris la suspension ou la suppression
          définitive du compte client.
        </Section>

        <Section title="9. Responsabilité">
          Shopyz met en œuvre les moyens raisonnables pour assurer la sécurité et la fiabilité de
          la plateforme, mais ne peut être tenu responsable des litiges directs entre marchands et
          clients concernant la qualité, la conformité ou la livraison des produits, sauf en cas de
          manquement propre à ses obligations techniques et contractuelles.
        </Section>

        <Section title="10. Modification des CGU">
          Shopyz se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs
          seront informés de toute modification substantielle et devront accepter la nouvelle
          version pour continuer à utiliser la plateforme.
        </Section>

        <Section title="11. Contact">
          Pour toute question relative aux présentes CGU, l'utilisateur peut contacter Shopyz via
          la page "Nous contacter".
        </Section>
      </main>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 15, color: "var(--ink)", marginBottom: 8, fontWeight: 700 }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7 }}>{children}</p>
    </section>
  );
}
