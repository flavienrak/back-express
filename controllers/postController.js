const UserModel = require("../models/UserModel");
const PostModel = require("../models/PostModel");
const NotificationModel = require("../models/NotificationModel");

const fs = require("fs");
const path = require("path");

const { isEmpty } = require("../lib/allFunctions");
const { isValidObjectId } = require("mongoose");
const { io, getReceiverSocketId } = require("../socket");

module.exports.getAllPosts = async (req, res) => {
  try {
    let user = null;
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    const posts = await PostModel.find().sort({ updatedAt: -1 });
    // const users = await UserModel.find();

    // if (!isEmpty(posts) && !isEmpty(users)) {
    //   for (const item of posts) {
    //     for (const us of users) {
    //       if (item && us) {
    //         if (
    //           item.senderId === us._id.toString() &&
    //           !us.posts?.includes(item._id.toString())
    //         ) {
    //           await UserModel.findByIdAndUpdate(
    //             us._id,
    //             { $push: { posts: item._id } },
    //             { new: true }
    //           );
    //         }
    //       }
    //     }
    //   }
    // }

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
    let user = null;
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    } else if (isEmpty(params?.postId) || !isValidObjectId(params?.postId)) {
      return res.json({ postIdRequired: true });
    }

    user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    const post = await PostModel.findById(params.postId);
    if (isEmpty(post)) {
      return res.json({ postNotFound: true });
    }

    if (user.rejectedPost.includes(params.postId)) {
      user = await UserModel.findByIdAndUpdate(
        params.id,
        { $pull: { rejectedPost: params.postId } },
        { new: true }
      );
    }

    return res
      .status(200)
      .json({ post, user: { rejectedPost: user.rejectedPost } });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.likePost = async (req, res) => {
  try {
    let user = null;
    let post = null;
    let notification = null;
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    } else if (isEmpty(params?.postId) || !isValidObjectId(params?.postId)) {
      return res.json({ postIdRequired: true });
    }

    user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    post = await PostModel.findById(params.postId);
    if (isEmpty(post)) {
      return res.json({ postNotFound: true });
    }

    const receiverSocketId = getReceiverSocketId(post.senderId);

    if (post.likes.includes(params.id)) {
      post = await PostModel.findByIdAndUpdate(
        params.postId,
        { $pull: { likes: params.id } },
        { new: true }
      );

      if (post.senderId !== params.id) {
        notification = await NotificationModel.findOne({
          userId: post.senderId,
          senderId: params.id,
          postId: params.postId,
          liked: true,
        });

        if (notification) {
          await NotificationModel.findByIdAndDelete(notification._id);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit(
              "unlikePostNotification",
              notification
            );
          }
        }
      }

      io.emit("unlikePost", post);
    } else {
      post = await PostModel.findByIdAndUpdate(
        params.postId,
        { $addToSet: { likes: params.id } },
        { new: true }
      );

      if (post.senderId !== params.id) {
        notification = await NotificationModel.findOne({
          userId: post.senderId,
          senderId: params.id,
          postId: params.postId,
          liked: true,
        });

        if (notification) {
          notification = await NotificationModel.findByIdAndUpdate(
            notification._id,
            { $set: { viewed: false } },
            { new: true }
          );
        } else {
          notification = await NotificationModel.create({
            userId: post.senderId,
            senderId: params.id,
            postId: params.postId,
            liked: true,
          });
        }

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("likePostNotification", notification);
        }
      }

      io.emit("likePost", post);
    }

    if (user.rejectedPost.includes(params.postId)) {
      user = await UserModel.findByIdAndUpdate(
        params.id,
        { $pull: { rejectedPost: params.postId } },
        { new: true }
      );
    }

    return res
      .status(200)
      .json({ post, user: { rejectedPost: user.rejectedPost } });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.commentPost = async (req, res) => {
  try {
    let post = null;
    let notification = null;
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
      return res.json({ postNotFound: true });
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
      { $addToSet: { comments: infos } },
      { new: true }
    );

    if (post.senderId !== params.id) {
      const receiverSocketId = getReceiverSocketId(post.senderId);

      notification = await NotificationModel.findOne({
        userId: post.senderId,
        senderId: params.id,
        postId: params.postId,
        commented: true,
      });

      if (notification) {
        notification = await NotificationModel.findByIdAndUpdate(
          notification._id,
          { $set: { viewed: false } },
          { new: true }
        );
      } else {
        notification = await NotificationModel.findOne({
          userId: post.senderId,
          senderId: params.id,
          postId: params.postId,
          commented: true,
          viewed: false,
        });

        if (notification) {
          notification = await NotificationModel.findByIdAndUpdate(
            notification._id,
            { $set: { viewed: false } },
            { new: true }
          );
        } else {
          notification = await NotificationModel.create({
            userId: post.senderId,
            senderId: params.id,
            postId: params.postId,
            commented: true,
            viewed: false,
          });
        }
      }

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("commentPostNotification", notification);
      }
    }
    io.emit("commentPost", post);

    if (user.rejectedPost.includes(params.postId)) {
      user = await UserModel.findByIdAndUpdate(
        params.id,
        { $pull: { rejectedPost: params.postId } },
        { new: true }
      );
    }

    return res
      .status(200)
      .json({ post, user: { rejectedPost: user.rejectedPost } });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.deleteComment = async (req, res) => {
  try {
    let user = null;
    let post = null;
    let notification = null;
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

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
      return res.json({ postNotFound: true });
    }

    const comments = post.comments.filter(
      (comment) => comment.userId === params.id
    );

    post = await PostModel.findByIdAndUpdate(
      params.postId,
      { $pull: { comments: { _id: params.commentId } } },
      { new: true }
    );

    if (post.senderId !== params.id) {
      const receiverSocketId = getReceiverSocketId(post.senderId);

      notification = await NotificationModel.findOne({
        userId: post.senderId,
        senderId: params.id,
        postId: params.postId,
        commented: true,
      });

      if (notification) {
        if (!isEmpty(comments) && comments?.length === 1) {
          notification = await NotificationModel.findByIdAndDelete(
            notification._id
          );
        }

        if (receiverSocketId) {
          io.to(receiverSocketId).emit(
            "deleteCommentPostNotification",
            notification
          );
        }
      }
    }

    io.emit("deleteCommentPost", post);

    if (user.rejectedPost.includes(params.postId)) {
      user = await UserModel.findByIdAndUpdate(
        params.id,
        { $pull: { rejectedPost: params.postId } },
        { new: true }
      );
    }

    return res
      .status(200)
      .json({ post, user: { rejectedPost: user.rejectedPost } });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.createPost = async (req, res) => {
  try {
    let fileName = null;
    let user = null;
    let users = null;
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

    if (!isEmpty(user.followers)) {
      for (const item of user.followers) {
        if (item) {
          const receiverSocketId = getReceiverSocketId(item);
          const notification = await NotificationModel.create({
            userId: item,
            senderId: params.id,
            postId: post._id,
            newPostFollowed: true,
            viewed: false,
          });

          if (notification && receiverSocketId) {
            io.to(receiverSocketId).emit("newPostFollowed", notification);
          }
        }
      }
    }

    users = await UserModel.find({ _id: { $ne: params.id } });

    if (!isEmpty(users)) {
      for (const item of users) {
        if (item && item._id) {
          const receiverSocketId = getReceiverSocketId(item._id.toString());
          const notification = await NotificationModel.create({
            userId: item._id.toString(),
            senderId: params.id,
            postId: post._id,
            newPost: true,
            viewed: false,
          });

          if (notification && receiverSocketId) {
            io.to(receiverSocketId).emit("createPost", notification);
          }
        }
      }
    }

    return res.status(200).json({ post });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.editPost = async (req, res) => {
  try {
    let fileName = null;
    let user = null;
    let post = null;
    // let users = null;
    const params = req.params;
    const body = req.body;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    } else if (isEmpty(params?.postId) || !isValidObjectId(params?.postId)) {
      return res.json({ postIdRequired: true });
    }

    user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    post = await PostModel.findById(params.postId);
    if (isEmpty(post)) {
      return res.json({ postNotFound: true });
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
      if (!isEmpty(post.image)) {
        const imagePath = path.join(__dirname, "../uploads/post", post.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      fileName = user._id + "-" + Date.now() + ".jpg";
      const filePath = path.join(__dirname, "../uploads/post", fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      infos.image = fileName;
    }

    post = await PostModel.findByIdAndUpdate(
      params.postId,
      { $set: infos },
      { new: true }
    );

    // users = await UserModel.find({ _id: { $ne: params.id } });

    // if (!isEmpty(users)) {
    //   for (const item of users) {
    //     if (item && item._id) {
    //       const receiverSocketId = getReceiverSocketId(item._id.toString());
    //       let notification = await NotificationModel.findOne({
    //         userId: item._id.toString(),
    //         senderId: params.id,
    //         postId: params.postId,
    //         editPost: true,
    //       });

    //       if (notification) {
    //         notification = await NotificationModel.findByIdAndUpdate(
    //           notification._id,
    //           { $set: { viewed: false } },
    //           { new: true }
    //         );
    //       } else {
    //         notification = await NotificationModel.create({
    //           userId: item._id,
    //           senderId: params.id,
    //           postId: params.postId,
    //           editPost: true,
    //           viewed: false,
    //         });
    //       }

    //       if (receiverSocketId) {
    //         io.to(receiverSocketId).emit("editPostNotification", notification);
    //       }
    //     }
    //   }
    // }

    io.emit("editPost", post);

    return res.status(200).json({ post });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.rejectPost = async (req, res) => {
  try {
    let user = null;
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    if (isEmpty(params?.postId) || !isValidObjectId(params?.postId)) {
      return res.json({ postIdRequired: true });
    }

    const post = await PostModel.findById(params.postId);

    if (isEmpty(post)) {
      return res.json({ postNotFound: true });
    }
    user = await UserModel.findByIdAndUpdate(
      params.id,
      { $push: { rejectedPost: params.postId } },
      { new: true }
    );

    return res
      .status(200)
      .json({ post, user: { rejectedPost: user.rejectedPost } });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.deletePost = async (req, res) => {
  try {
    let post = null;
    let users = null;
    let notifications = null;
    let user = null;
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    user = await UserModel.findById(params.id);
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

    if (!isEmpty(post?.image)) {
      const imagePath = path.join(__dirname, "../uploads/post", post.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    post = await PostModel.findByIdAndDelete(params.postId);
    user = await UserModel.findByIdAndUpdate(
      params.id,
      { $pull: { posts: params.postId } },
      { new: true }
    );

    users = await UserModel.find({ _id: { $ne: params.id } });

    if (!isEmpty(users)) {
      for (const item of users) {
        if (item && item._id) {
          const receiverSocketId = getReceiverSocketId(item._id.toString());
          const notification = await NotificationModel.findOne({
            userId: item._id.toString(),
            senderId: params.id,
            postId: params.postId,
            newPost: true,
          });

          if (notification && receiverSocketId) {
            io.to(receiverSocketId).emit(
              "deletePostNotification",
              notification
            );
          }
        }
      }
    }

    notifications = await NotificationModel.deleteMany({
      postId: params.postId,
    });

    io.emit("deletePost", post);

    return res.status(200).json({ post });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};
