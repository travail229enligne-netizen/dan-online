import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("dan_online_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => {
        window.localStorage.removeItem("dan_online_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier, password) => {
    const { data } = await api.post("/auth/login", { identifier, password });
    window.localStorage.setItem("dan_online_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    window.localStorage.setItem("dan_online_token", data.token);
    setUser(data.user);
    return data.user;
  };

  // Connecte l'utilisateur à partir d'un token déjà obtenu ailleurs
  // (ex: après une commande passée sans compte, qui en crée un silencieusement)
  const setSession = (token, userData) => {
    window.localStorage.setItem("dan_online_token", token);
    setUser(userData);
  };

  const setPassword = async (password) => {
    const { data } = await api.put("/auth/set-password", { password });
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    window.localStorage.removeItem("dan_online_token");
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, setSession, setPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
