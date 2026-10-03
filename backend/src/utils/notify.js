const Notification = require("../models/Notification");
const { sendPushToUser } = require("./pushNotify");

async function notify(userId, type, title, body = "", link = "") {
  try {
    await Notification.create({ user: userId, type, title, body, link });
  } catch (e) {
    console.error("notify error:", e.message);
  }

  try {
    await sendPushToUser(userId, { title, body, url: link });
  } catch (e) {
    console.error("push notify error:", e.message);
  }
}

module.exports = { notify };
