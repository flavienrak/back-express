const mongooose = require("mongoose");

const userSchema = new mongooose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      uppercase: true,
    },
    username: {
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
  },
  { timestamps: true }
);

const UserModel =
  mongooose.models.users || mongooose.model("users", userSchema);

module.exports = UserModel;
