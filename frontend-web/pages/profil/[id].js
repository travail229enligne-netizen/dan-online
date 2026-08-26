import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import api from "../../lib/api";

export default function ProfilPublic() {
  const router = useRouter();
  const { id } = router.query;
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    if (!id) return;
    api.get(`/auth/user/${id}`).then((r) => setProfile(r.data)).catch(() => setProfile(null));
  }, [id]);

  if (profile === undefined) return null;

  if (!profile) {
    return (
      <>
        <Header hideSearchBar />
        <main className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)" }}>Profil introuvable.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header hideSearchBar />
      <main className="container" style={{ maxWidth: 420, paddingTop: 30, paddingBottom: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 20 }}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.name} style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 84, height: 84, borderRadius: "50%", background: "var(--ink)", color: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 28 }}>
              {profile.name?.[0]?.toUpperCase()}
            </div>
          )}
          <h1 style={{ fontSize: 20, marginTop: 12 }}>{profile.name}</h1>
          <span
            style={{
              display: "inline-block",
              marginTop: 6,
              padding: "3px 10px",
              borderRadius: 20,
              background: "var(--cream)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--green-deep)",
            }}
          >
            {profile.role === "marchand" ? "Marchand" : "Client"}
          </span>
        </div>

        {profile.bio && (
          <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{profile.bio}</p>
          </div>
        )}

        {(profile.phone || profile.locationLabel) && (
          <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {profile.phone && (
              <div style={{ fontSize: 13 }}>
                <span style={{ color: "var(--ink-soft)" }}>Téléphone : </span>
                {profile.phone}
              </div>
            )}
            {profile.locationLabel && (
              <div style={{ fontSize: 13 }}>
                <span style={{ color: "var(--ink-soft)" }}>Localisation : </span>
                {profile.locationMapUrl ? (
                  <a href={profile.locationMapUrl} target="_blank" rel="noreferrer" style={{ color: "var(--terracotta-dark)", fontWeight: 600 }}>
                    {profile.locationLabel}
                  </a>
                ) : (
                  profile.locationLabel
                )}
              </div>
            )}
          </div>
        )}

        {!profile.bio && !profile.phone && !profile.locationLabel && (
          <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center" }}>
            Cet utilisateur n'a pas encore complété son profil public.
          </p>
        )}
      </main>
    </>
  );
}
