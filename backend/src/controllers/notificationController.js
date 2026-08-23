const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
  const unreadOrders = await Notification.countDocuments({
    user: req.user._id,
    read: false,
    type: { $in: ["new_order", "order_status"] },
  });
  res.json({ notifications, unreadCount, unreadOrders });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
  if (!notif) return res.status(404).json({ message: "Notification introuvable." });
  res.json(notif);
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: "Tout marqué comme lu." });
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
