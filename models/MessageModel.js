const mongooose = require("mongoose");

const messageSchema = new mongooose.Schema(
  {
    senderId: {
      type: String,
      trim: true,
      required: true,
    },
    receiverId: {
      type: String,
      trim: true,
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      default: "sending",
    },
  },
  { timestamps: true }
);

const MessageModel =
  mongooose.models.messages || mongooose.model("messages", messageSchema);

module.exports = MessageModel;
