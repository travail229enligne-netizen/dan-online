import { useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { useAuth } from "../lib/auth";

export default function Inscription() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    role: "client",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(form);
      router.push(user.role === "marchand" ? "/marchand/bienvenue" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ maxWidth: 420, paddingTop: 40, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Créer un compte</h1>
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
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: "client" })}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: `2px solid ${form.role === "client" ? "var(--terracotta)" : "var(--line)"}`,
                background: form.role === "client" ? "var(--terracotta)" : "var(--white)",
                color: form.role === "client" ? "var(--white)" : "var(--ink)",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Je suis client
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: "marchand" })}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: `2px solid ${form.role === "marchand" ? "var(--terracotta)" : "var(--line)"}`,
                background: form.role === "marchand" ? "var(--terracotta)" : "var(--white)",
                color: form.role === "marchand" ? "var(--white)" : "var(--ink)",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Je suis marchand
            </button>
          </div>

          <label style={{ fontSize: 12 }}>
            Nom complet
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
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
            Téléphone
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          <label style={{ fontSize: 12 }}>
            Adresse de livraison
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          <label style={{ fontSize: 12 }}>
            Mot de passe
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ width: "100%", padding: 10, marginTop: 4, border: "1px solid var(--line)", borderRadius: 8 }}
            />
          </label>
          {error && <p style={{ color: "var(--terracotta-dark)", fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Création..." : "Créer mon compte"}
          </button>
          <p style={{ fontSize: 13, textAlign: "center", color: "var(--ink-soft)" }}>
            Déjà un compte ? <a href="/connexion" style={{ color: "var(--terracotta-dark)", fontWeight: 600 }}>Connecte-toi</a>
          </p>
        </form>
      </main>
    </>
  );
}
