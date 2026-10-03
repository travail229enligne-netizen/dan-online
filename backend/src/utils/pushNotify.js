const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

webpush.setVapidDetails(
  "mailto:contact@dan-online.bj",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Envoie une notification push a un utilisateur precis (ex: le marchand d'une boutique)
// payload: { title, body, url } - url est la page a ouvrir au clic sur la notif
const sendPushToUser = async (userId, payload) => {
  const subs = await PushSubscription.find({ user: userId });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload)
        );
      } catch (err) {
        // Abonnement expire ou invalide -> on le supprime silencieusement
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error("Erreur envoi push:", err.message);
        }
      }
    })
  );
};

module.exports = { sendPushToUser };
