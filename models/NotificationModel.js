const mongooose = require("mongoose");

const notificationSchema = new mongooose.Schema(
  {
    senderId: {
      type: String,
      trim: true,
      required: true,
    },
    userId: {
      type: String,
      trim: true,
      default: "",
    },
    postId: {
      type: String,
      trim: true,
      default: "",
    },
    messageId: {
      type: String,
      trim: true,
      default: "",
    },
    newPost: {
      type: Boolean,
      default: false,
    },
    newPostFollowed: {
      type: Boolean,
      default: false,
    },
    editPost: {
      type: Boolean,
      default: false,
    },
    newMessage: {
      type: Boolean,
      default: false,
    },
    followed: {
      type: Boolean,
      default: false,
    },
    liked: {
      type: Boolean,
      default: false,
    },
    commented: {
      type: Boolean,
      default: false,
    },
    viewed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const NotificationModel =
  mongooose.models.notifications ||
  mongooose.model("notifications", notificationSchema);

module.exports = NotificationModel;
