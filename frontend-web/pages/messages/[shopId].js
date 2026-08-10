import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function StartConversation() {
  const router = useRouter();
  const { shopId } = router.query;
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!shopId || loading || !user) return;
    api.post(`/messages/start/${shopId}`).then((r) => {
      router.replace(`/messages/c/${r.data._id}`);
    });
  }, [shopId, loading, user]);

  return null;
}
