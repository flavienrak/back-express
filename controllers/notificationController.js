const UserModel = require("../models/UserModel");
const NotificationModel = require("../models/NotificationModel");

const { isEmpty } = require("../lib/allFunctions");
const { isValidObjectId } = require("mongoose");

module.exports.getNotifs = async (req, res) => {
  try {
    const params = req.params;
    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    const notifications = await NotificationModel.find({
      userId: params.id,
    }).sort({ updatedAt: -1 });

    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.viewAll = async (req, res) => {
  try {
    let notifications = null;
    const params = req.params;
    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    notifications = await NotificationModel.updateMany(
      {
        userId: params.id,
        viewed: false,
        $or: [{ liked: true }, { commented: true }, { followed: true }],
      },
      { $set: { viewed: true } },
      { new: true, multi: true }
    );

    notifications = await NotificationModel.find({
      userId: params.id,
      $or: [{ liked: true }, { commented: true }, { followed: true }],
    });

    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.viewAllPosts = async (req, res) => {
  try {
    let notifications = null;
    const params = req.params;
    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    notifications = await NotificationModel.find({
      userId: params.id,
      $or: [{ newPost: true }, { editPost: true }],
    });
    await NotificationModel.deleteMany({
      userId: params.id,
      $or: [{ newPost: true }, { editPost: true }],
    });

    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.viewAllMessages = async (req, res) => {
  try {
    let notifications = null;
    const params = req.params;
    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    notifications = await NotificationModel.find({
      userId: params.id,
      newMessage: true,
    });
    await NotificationModel.deleteMany({
      userId: params.id,
      newMessage: true,
    });

    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};
