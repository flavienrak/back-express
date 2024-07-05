const { isEmpty } = require("../lib/allFunctions");
const { isValidObjectId } = require("mongoose");

const UserModel = require("../models/UserModel");
const fs = require("fs");
const path = require("path");
const PostModel = require("../models/PostModel");
const MessageModel = require("../models/MessageModel");
const { getReceiverSocketId, io } = require("../socket");

module.exports.getUsers = async (req, res) => {
  try {
    const params = req.params;
    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    const users = await UserModel.find()
      .select("-password")
      .sort({ createdAt: -1 });

    // users.forEach(async (item) => {
    //   if (item.followed.includes(item._id)) {
    //     await UserModel.findByIdAndUpdate(
    //       item._id,
    //       { $pull: { followed: item._id } },
    //       { new: true }
    //     );
    //   }
    //   if (item.followers.includes(item._id)) {
    //     console.log("removed to followers");
    //     await UserModel.findByIdAndUpdate(
    //       item._id,
    //       { $pull: { followers: item._id } },
    //       { new: true }
    //     );
    //   }
    // });

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.getUser = async (req, res) => {
  try {
    const params = req.params;
    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    const { password, ...userWithoutPassword } = user._doc;

    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.viewProfil = async (req, res) => {
  try {
    let userToView = null;
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }
    if (isEmpty(params?.userId) || !isValidObjectId(params?.userId)) {
      return res.json({ userIdRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    userToView = await UserModel.findById(params.userId);
    if (isEmpty(userToView)) {
      return res.json({ userToViewNotFound: true });
    }

    if (!userToView.views.includes(params.id)) {
      userToView = await UserModel.findByIdAndUpdate(
        params.userId,
        { $push: { views: params.id } },
        { new: true }
      );
    }
    const { password, ...userWithoutPassword } = userToView._doc;

    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.followUser = async (req, res) => {
  try {
    let user = {};
    let userToFollow = {};
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    } else if (isEmpty(params?.userId) || !isValidObjectId(params?.userId)) {
      return res.json({ userIdRequired: true });
    }

    user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    userToFollow = await UserModel.findById(params.userId);
    if (isEmpty(userToFollow)) {
      return res.json({ userToFollowNotFound: true });
    }

    if (user.rejected.includes(params.userId)) {
      user = await UserModel.findByIdAndUpdate(
        params.id,
        {
          $pull: { rejected: params.userId },
          $push: { followed: params.userId },
        },
        { new: true }
      );

      userToFollow = await UserModel.findByIdAndUpdate(
        params.userId,
        { $push: { followers: params.id } },
        { new: true }
      );
    } else if (user.followed?.includes(params.userId)) {
      user = await UserModel.findByIdAndUpdate(
        params.id,
        { $pull: { followed: params.userId } },
        { new: true }
      );

      userToFollow = await UserModel.findByIdAndUpdate(
        params.userId,
        { $pull: { followers: params.id } },
        { new: true }
      );
    } else {
      user = await UserModel.findByIdAndUpdate(
        params.id,
        { $push: { followed: params.userId } },
        { new: true }
      );

      userToFollow = await UserModel.findByIdAndUpdate(
        params.userId,
        { $push: { followers: params.id } },
        { new: true }
      );
    }

    const receiverSocketId = getReceiverSocketId(params.userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("followed", userToFollow.followers);
    }

    return res.status(200).json({
      user: { followed: user.followed },
    });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.rejectUser = async (req, res) => {
  try {
    let user = {};
    let userToFollow = {};
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    } else if (isEmpty(params?.userId) || !isValidObjectId(params?.userId)) {
      return res.json({ userIdRequired: true });
    }

    user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    userToFollow = await UserModel.findById(params.userId);
    if (isEmpty(userToFollow)) {
      return res.json({ userToFollowNotFound: true });
    }

    if (user.followed?.includes(params.userId)) {
      user = await UserModel.findByIdAndUpdate(
        params.id,
        {
          $pull: { followed: params.userId },
          $push: { rejected: params.userId },
        },
        { new: true }
      );
    } else {
      user = await UserModel.findByIdAndUpdate(
        params.id,
        { $push: { rejected: params.userId } },
        { new: true }
      );
    }

    return res.status(200).json({
      user: { followed: user.followed, rejected: user.rejected },
    });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.editProfil = async (req, res) => {
  try {
    let user = null;
    let fileName = null;
    const body = req.body;
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.status(400).json({ userNotFound: true });
    }

    if (!isEmpty(body?.name) && body?.name?.trim().length < 3) {
      return res.status(400).json({ nameError: true });
    }

    const infos = {};

    if (!isEmpty(body.name)) {
      infos.name = body.name.trim();
    }

    if (req.file) {
      if (
        req.file.mimetype !== "image/jpg" &&
        req.file.mimetype !== "image/jpeg" &&
        req.file.mimetype !== "image/png"
      ) {
        return res.json({ invalidFormat: true });
      }
      fileName = user._id + ".jpg";
      const filePath = path.join(__dirname, "../uploads/profile", fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      infos.image = fileName;
    }

    user = await UserModel.findByIdAndUpdate(
      params.id,
      { $set: infos },
      { new: true }
    );

    return res.status(200).json({ user: infos });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.search = async (req, res) => {
  try {
    let user = null;
    const body = req.body;
    const params = req.params;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.status(400).json({ userNotFound: true });
    }

    if (!isEmpty(body?.key) && body?.key?.trim().length < 3) {
      return res.status(400).json({ keyError: true });
    }

    const regex = new RegExp(body.key.trim(), "i");

    // Rechercher dans les collections utilisateurs, posts, et messages en parallèle
    const [users, posts, messages] = await Promise.all([
      UserModel.find({
        $and: [
          { $or: [{ name: regex }, { email: regex }] },
          { _id: { $ne: params.id } },
        ],
      }).sort({ updatedAt: -1 }),
      PostModel.find({ $or: [{ message: regex }] }).sort({ updatedAt: -1 }),
      MessageModel.find({ $or: [{ message: regex }] }).sort({ updatedAt: -1 }),
    ]);

    // Combiner les résultats
    const results = {
      users,
      posts,
      messages,
    };

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};
