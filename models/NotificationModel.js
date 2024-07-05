const mongooose = require("mongoose");

const notificationSchema = new mongooose.Schema(
  {
    userId: {
      type: String,
      trim: true,
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true }
);

const NotificationModel =
  mongooose.models.notifications ||
  mongooose.model("notifications", notificationSchema);

module.exports = NotificationModel;
