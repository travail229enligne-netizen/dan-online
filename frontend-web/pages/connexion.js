import { useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { useAuth } from "../lib/auth";

export default function Connexion() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      router.push(user.role === "marchand" ? "/marchand/dashboard" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Connexion impossible.");
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
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          <p style={{ fontSize: 13, textAlign: "center", color: "var(--ink-soft)" }}>
            Pas encore de compte ? <a href="/inscription" style={{ color: "var(--terracotta-dark)", fontWeight: 600 }}>Inscris-toi</a>
          </p>
        </form>
      </main>
    </>
  );
}
