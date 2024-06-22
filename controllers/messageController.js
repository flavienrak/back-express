const { isValidObjectId } = require("mongoose");
const { isEmpty } = require("../lib/allFunctions");

const mongoose = require("mongoose");
const MessageModel = require("../models/MessageModel");
const UserModel = require("../models/UserModel");

module.exports.getMessages = async (req, res) => {
  try {
    const messages = await MessageModel.find();
    return res.status(200).json({ messages });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.createMessage = async (req, res) => {
  try {
    const body = req.body;

    if (isEmpty(body?.senderId) || !isValidObjectId(body?.senderId?.trim())) {
      return res.status(400).json({ senderIdRequired: true });
    } else if (
      isEmpty(body?.receiverId) ||
      !isValidObjectId(body?.receiverId?.trim())
    ) {
      return res.status(400).json({ receiverIdRequired: true });
    } else if (isEmpty(body?.message?.trim())) {
      return res.status(400).json({ messageRequired: true });
    }

    const sender = await UserModel.findById(body.senderId);
    if (isEmpty(sender)) {
      return res.status(400).json({ senderNotFound: true });
    }

    const receiver = await UserModel.findById(body.receiverId);
    if (isEmpty(receiver)) {
      return res.status(400).json({ receiverNotFound: true });
    }

    const senderId = new mongoose.Types.ObjectId(req.body.senderId);
    const receiverId = new mongoose.Types.ObjectId(req.body.receiverId);

    if (senderId.equals(receiverId)) {
      return res.status(400).json({ invalidReceiver: true });
    }

    const message = await MessageModel.create({
      senderId: body.senderId,
      receiverId: body.receiverId,
      message: body.message,
    });

    return res.status(200).json({ message });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};
