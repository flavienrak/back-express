const { isEmpty } = require("../lib/allFunctions");
const { isValidObjectId } = require("mongoose");

const UserModel = require("../models/UserModel");
const PostModel = require("../models/PostModel");
const fs = require("fs");
const path = require("path");

module.exports.getAllPosts = async (req, res) => {
  try {
    const posts = await PostModel.find().sort({ updatedAt: -1 });

    // posts.forEach(async (p) => {
    //   let user = await UserModel.findById(p.senderId);
    //   if (!user.posts.includes(p._id)) {
    //     user = await UserModel.findByIdAndUpdate(
    //       p.senderId,
    //       { $push: { posts: p._id } },
    //       { new: true }
    //     );
    //   }
    // });

    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.getMyPosts = async (req, res) => {
  try {
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    const posts = await PostModel.find({ senderId: params.id }).sort({
      updatedAt: -1,
    });

    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.getPost = async (req, res) => {
  try {
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    } else if (isEmpty(params?.postId) || !isValidObjectId(params?.postId)) {
      return res.json({ postIdRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    const post = await PostModel.findById(params.postId);

    return res.status(200).json({ post });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.likePost = async (req, res) => {
  try {
    let post = {};
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    } else if (isEmpty(params?.postId) || !isValidObjectId(params?.postId)) {
      return res.json({ postIdRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    post = await PostModel.findById(params.postId);
    if (isEmpty(post)) {
      return res.json({ postdotFount: true });
    }

    if (post.likes?.includes(params.id)) {
      post = await PostModel.findByIdAndUpdate(
        params.postId,
        {
          $pull: { likes: user._id },
        },
        { new: true }
      );
    } else {
      post = await PostModel.findByIdAndUpdate(
        params.postId,
        {
          $addToSet: { likes: user._id },
        },
        { new: true }
      );
    }

    return res.status(200).json({ post });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.commentPost = async (req, res) => {
  try {
    let post = {};
    const body = req.body;
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    } else if (isEmpty(params?.postId) || !isValidObjectId(params?.postId)) {
      return res.json({ postIdRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    post = await PostModel.findById(params.postId);
    if (isEmpty(post)) {
      return res.json({ postdotFount: true });
    }

    if (isEmpty(body?.comment)) {
      return res.json({ commentRequired: true });
    }

    const infos = {
      userId: user._id,
      text: body.comment?.trim(),
      timestamp: new Date().getTime(),
    };

    post = await PostModel.findByIdAndUpdate(
      params.postId,
      {
        $addToSet: { comments: infos },
      },
      { new: true }
    );

    return res.status(200).json({ post });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.deleteComment = async (req, res) => {
  try {
    let post = {};
    const params = req.params;

    if (isEmpty(params?.postId) || !isValidObjectId(params?.postId)) {
      return res.json({ postIdRequired: true });
    } else if (
      isEmpty(params?.commentId) ||
      !isValidObjectId(params?.commentId)
    ) {
      return res.json({ commentIdRequired: true });
    }

    post = await PostModel.findById(params.postId);
    if (isEmpty(post)) {
      return res.json({ postdotFount: true });
    }

    post = await PostModel.findByIdAndUpdate(
      params.postId,
      {
        $pull: { comments: { _id: params.commentId } },
      },
      { new: true }
    );

    return res.status(200).json({ post });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.createPost = async (req, res) => {
  try {
    let fileName = null;
    let user = null;
    const params = req.params;
    const body = req.body;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    if (isEmpty(body?.message) && !req.file) {
      return res.json({ dataRequired: true });
    }

    let infos = {};
    infos.senderId = params.id;

    if (!isEmpty(body?.message?.trim())) {
      infos.message = body.message.trim();
    }

    if (req.file) {
      if (
        req.file.mimetype !== "image/jpg" &&
        req.file.mimetype !== "image/jpeg" &&
        req.file.mimetype !== "image/png"
      ) {
        return res.json({ invalidFormat: true });
      }
      fileName = user._id + "-" + Date.now() + ".jpg";
      const filePath = path.join(__dirname, "../uploads/post", fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      infos.image = fileName;
    }

    const post = await PostModel.create(infos);

    user = await UserModel.findByIdAndUpdate(
      params.id,
      { $push: { posts: post._id } },
      { new: true }
    );

    return res.status(200).json({ post });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.deletePost = async (req, res) => {
  try {
    let post = {};
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    if (isEmpty(params?.postId) || !isValidObjectId(params?.postId)) {
      return res.json({ postIdRequired: true });
    }

    post = await PostModel.findById(params.postId);

    if (isEmpty(post)) {
      return res.json({ postNotFound: true });
    } else if (post.senderId !== params.id) {
      return res.json({ notYourPost: true });
    }

    post = await PostModel.findByIdAndDelete(params.postId);

    const imagePath = path.join(__dirname, "../uploads/post", post.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    return res.status(200).json({ post });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};
