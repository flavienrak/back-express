const mongooose = require("mongoose");

const postSchema = new mongooose.Schema(
  {
    senderId: {
      type: String,
      trim: true,
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    likes: {
      type: [String],
      default: [],
    },
    comments: {
      type: [
        {
          userId: String,
          text: String,
          timestamp: Number,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const PostModel =
  mongooose.models.posts || mongooose.model("posts", postSchema);

module.exports = PostModel;
