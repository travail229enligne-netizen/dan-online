import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { useAuth } from "../lib/auth";

export default function Connexion() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  // Redirection apres connexion (?next=/chemin), uniquement vers une page du site
  const getNext = () => {
    const n = router.query.next;
    return typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : null;
  };
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.identifier, form.password);
      router.push(getNext() || (user.role === "marchand" ? "/marchand/dashboard" : "/"));
    } catch (err) {
      setError(err.response?.data?.message || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      router.push(getNext() || (user.role === "marchand" ? "/marchand/dashboard" : "/"));
    } catch (err) {
      setError(err.response?.data?.message || "Connexion Google impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ maxWidth: 420, paddingTop: 40, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Connexion</h1>
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <label style={{ fontSize: 12 }}>
            Email ou téléphone
            <input
              required
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          <label style={{ fontSize: 12 }}>
            Mot de passe
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          <a href="/mot-de-passe-oublie" style={{ fontSize: 12, color: "var(--ink-soft)", alignSelf: "flex-end" }}>
            Mot de passe oublié ?
          </a>
          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>ou</span>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Connexion Google impossible.")}
              text="signin_with"
              locale="fr"
              width="280"
            />
          </div>
          <p style={{ fontSize: 13, textAlign: "center", color: "var(--ink-soft)" }}>
            Pas encore de compte ? <a href="/inscription" style={{ color: "var(--terracotta-dark)", fontWeight: 600 }}>Inscris-toi</a>
          </p>
        </form>
      </main>
    </>
  );
}
