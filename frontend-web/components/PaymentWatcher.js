import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

export default function PaymentWatcher() {
  const { user } = useAuth();
  const router = useRouter();
  const seenRef = useRef(new Set());

  useEffect(() => {
    if (!user || user.role !== "client") return;

    const check = () => {
      api
        .get("/orders/pending-payment")
        .then((r) => {
          const orderId = r.data.orderId;
          if (!orderId) return;
          if (seenRef.current.has(orderId)) return;
          if (router.pathname === "/payer-commande/[id]" && router.query.id === orderId) return;

          seenRef.current.add(orderId);
          router.push(`/payer-commande/${orderId}`);
        })
        .catch(() => {});
    };

    check();
    const interval = setInterval(check, 8000);
    return () => clearInterval(interval);
  }, [user, router.pathname, router.query.id]);

  return null;
}
