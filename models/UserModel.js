const mongooose = require("mongoose");

const userSchema = new mongooose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      trim: true,
    },
    notifications: {
      type: [String],
      default: [],
    },
    messages: {
      type: [String],
      default: [],
    },
    views: {
      type: [String],
      default: [],
    },
    posts: {
      type: [String],
      default: [],
    },
    followers: {
      type: [String],
      default: [],
    },
    followed: {
      type: [String],
      default: [],
    },
    rejectedPost: {
      type: [String],
      default: [],
    },
    rejected: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const UserModel =
  mongooose.models.users || mongooose.model("users", userSchema);

module.exports = UserModel;
