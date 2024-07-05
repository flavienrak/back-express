const { isValidObjectId } = require("mongoose");
const { isEmpty } = require("../lib/allFunctions");

const MessageModel = require("../models/MessageModel");
const UserModel = require("../models/UserModel");
const { getReceiverSocketId, io } = require("../socket");

module.exports.getMessages = async (req, res) => {
  try {
    const params = req.params;
    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ idRequired: true });
    }

    const user = await UserModel.findById(params.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    const messages = await MessageModel.find({
      $or: [{ senderId: params.id }, { receiverId: params.id }],
    });

    const groupedMessages = messages.reduce((acc, message) => {
      const otherUserId =
        message.senderId === params.id ? message.receiverId : message.senderId;
      if (!acc[otherUserId]) {
        acc[otherUserId] = [];
      }
      acc[otherUserId].push(message);
      return acc;
    }, {});

    let result = Object.keys(groupedMessages).map((key) => ({
      userId: key,
      messages: groupedMessages[key],
    }));

    const getLastMessageUpdatedAt = (messages) => {
      if (messages.length === 0) {
        return null;
      }
      return new Date(messages[messages.length - 1].updatedAt);
    };

    result.sort((a, b) => {
      const lastMessageDateA = getLastMessageUpdatedAt(a.messages);
      const lastMessageDateB = getLastMessageUpdatedAt(b.messages);
      return lastMessageDateB - lastMessageDateA;
    });

    return res.status(200).json({ messages: result });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.sendMessage = async (req, res) => {
  try {
    const params = req.params;
    const body = req.body;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ senderIdRequired: true });
    } else if (isEmpty(params?.userId) || !isValidObjectId(params?.userId)) {
      return res.json({ userIdRequired: true });
    } else if (isEmpty(body?.message?.trim())) {
      return res.json({ messageRequired: true });
    }

    const sender = await UserModel.findById(params.id);
    if (isEmpty(sender)) {
      return res.json({ senderNotFound: true });
    }

    const receiver = await UserModel.findById(params.userId);
    if (isEmpty(receiver)) {
      return res.json({ receiverNotFound: true });
    }

    if (params.id === params.userId) {
      return res.json({ receiverRequired: true });
    }

    const message = await MessageModel.create({
      senderId: params.id,
      receiverId: params.userId,
      message: body.message.trim(),
    });

    const receiverSocketId = getReceiverSocketId(params.userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        message,
        userId: params.id,
      });
    }

    return res.status(200).json({ message });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.deleteMessage = async (req, res) => {
  try {
    const params = req.params;
    let message = null;

    if (isEmpty(params?.id) || !isValidObjectId(params?.id)) {
      return res.json({ senderIdRequired: true });
    } else if (isEmpty(params?.userId) || !isValidObjectId(params?.userId)) {
      return res.json({ userIdRequired: true });
    } else if (
      isEmpty(params?.messageId) ||
      !isValidObjectId(params?.messageId)
    ) {
      return res.json({ messageIdRequired: true });
    }

    const sender = await UserModel.findById(params.id);
    if (isEmpty(sender)) {
      return res.json({ senderNotFound: true });
    }

    const receiver = await UserModel.findById(params.userId);
    if (isEmpty(receiver)) {
      return res.json({ receiverNotFound: true });
    }

    message = await MessageModel.findById(params.messageId);
    if (isEmpty(message)) {
      return res.json({ messageNotFound: true });
    } else if (message.senderId !== params.id) {
      return res.json({ notYourMessage: true });
    }

    message = await MessageModel.findByIdAndDelete(params.messageId);

    const receiverSocketId = getReceiverSocketId(params.userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("deleteMessage", {
        message,
        userId: params.id,
      });
    }

    return res.status(200).json({ message });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};
