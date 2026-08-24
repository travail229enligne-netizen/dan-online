import { useRouter } from "next/router";
import MerchantLayout from "../../components/MerchantLayout";
import { useAuth } from "../../lib/auth";

export default function Bienvenue() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <MerchantLayout title="Bienvenue">
      <div style={{ textAlign: "center", paddingTop: 30, maxWidth: 420, margin: "0 auto" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>
          Bienvenue{user?.name ? `, ${user.name}` : ""} !
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 24, lineHeight: 1.5 }}>
          Ton compte marchand est prêt. Il ne reste plus qu'une étape avant de vendre sur EasyShop :
          créer ta boutique.
        </p>
        <button
          className="btn-primary"
          onClick={() => router.push("/marchand/boutique")}
          style={{ width: "100%", marginBottom: 12 }}
        >
          Créer ma boutique
        </button>
        <button
          onClick={() => router.push("/marchand/dashboard")}
          style={{ fontSize: 13, color: "var(--ink-soft)", textDecoration: "underline" }}
        >
          Plus tard, aller au tableau de bord
        </button>
      </div>
    </MerchantLayout>
  );
}
