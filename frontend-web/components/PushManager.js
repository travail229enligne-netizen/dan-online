import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import PushPrompt from "./PushPrompt";

const PROMPT_SHOWN_KEY = "shopyz_push_prompt_shown";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushManager() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const setup = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await api.post("/push/subscribe", existing.toJSON());
          return;
        }

        if (Notification.permission === "denied") return;
        if (Notification.permission === "granted") return;

        const alreadyShown = window.localStorage.getItem(PROMPT_SHOWN_KEY);
        if (!alreadyShown) {
          setShowPrompt(true);
        }
      } catch (e) {
        console.error("Push setup error:", e.message);
      }
    };

    setup();
  }, [user]);

  const handleConfirm = async () => {
    window.localStorage.setItem(PROMPT_SHOWN_KEY, "1");
    setShowPrompt(false);
    try {
      await subscribeToPush();
    } catch (e) {
      console.error("Push subscribe error:", e.message);
    }
  };

  if (!showPrompt) return null;
  return <PushPrompt onConfirm={handleConfirm} />;
}

export async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Les notifications push ne sont pas supportées sur ce navigateur.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permission refusée.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const { data } = await api.get("/push/vapid-public-key");
  const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }

  await api.post("/push/subscribe", subscription.toJSON());
  return subscription;
}
