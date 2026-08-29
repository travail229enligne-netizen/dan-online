const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendEmail(to, subject, html) {
  if (!resend) {
    console.warn("RESEND_API_KEY manquant, email non envoye:", subject);
    return;
  }
  try {
    await resend.emails.send({
      from: "EasyShop <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Erreur envoi email:", err.message);
  }
}

module.exports = { sendEmail };
