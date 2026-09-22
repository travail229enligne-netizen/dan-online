import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function StartConversation() {
  const router = useRouter();
  const { shopId, produit, prix } = router.query;
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!shopId || loading || !user) return;

    api.post(`/messages/start/${shopId}`).then(async (r) => {
      const conversationId = r.data._id;

      if (produit) {
        const priceText = prix ? ` (prix affiché : ${Number(prix).toLocaleString("fr-FR")} FCFA)` : "";
        const text = `Bonjour, je voudrais négocier pour "${produit}"${priceText}.`;
        try {
          await api.post(`/messages/${conversationId}`, { text });
        } catch {
          // si l'envoi echoue, on redirige quand meme vers la conversation
        }
      }

      router.replace(`/messages/c/${conversationId}`);
    });
  }, [shopId, loading, user, produit, prix]);

  return null;
}
