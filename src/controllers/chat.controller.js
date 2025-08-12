const { Op } = require("sequelize");
const db = require("../models");
const Chat = db.chats;
const Message = db.messages;

// Create or get chat for delivery/user context
exports.getOrCreateChat = async (req, res) => {
  const { deliveryId } = req.body;
  try {
    let chat = await Chat.findOne({ where: { deliveryId } });
    if (!chat) chat = await Chat.create({ deliveryId });
    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch messages for a chat
exports.getMessages = async (req, res) => {
  const { chatId } = req.params;
  try {
    const messages = await Message.findAll({
      where: { chatId },
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch messages for a chat
exports.updateReadCount = async (req, res) => {
  const { chatId } = req.params;
  const { count, role } = req.body;

  try {
    const chat = await Chat.findByPk(chatId);

    if (role === "rider") {
      chat.riderReadCount = +count;
      chat.save();
    } else {
      chat.userReadCount = +count;
      chat.save();
    }

    res.status(200).json({ message: "Done" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch messages for a chat
exports.getUnReadCount = async (req, res) => {
  const { deliveryId, role } = req.params;
  try {
    let chat = await Chat.findOne({ where: { deliveryId } });
    if (!chat) {
      const newChat = await Chat.create({ deliveryId });
      return res.status(200).json({ unreadCount: 0, chatId: newChat?.id });
    }

    const messagesCount = await Message.count({
      where: {
        chatId: chat?.id,
        senderId: {
          [Op.ne]: req.userId,
        },
      },
    });

    const totalCount = Number(messagesCount);
    const readCount = Number(
      role === "rider" ? chat?.riderReadCount : chat?.userReadCount
    );

    // If parsing fails, default to 0
    const validTotal = Number.isNaN(totalCount) ? 0 : totalCount;
    const validRead = Number.isNaN(readCount) ? 0 : readCount;

    const unreadCount = Math.max(0, validTotal - validRead);

    res.status(200).json({ unreadCount, chatId: chat?.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add message
exports.sendMessage = async (req, res) => {
  const { chatId, text, receiverId, senderName } = req.body;
  const senderId = req.userId;
  try {
    const message = await Message.create({ chatId, senderId, text });
    // emit via socket
    req.io
      .to(receiverId)
      .emit("newMessage", { ...message?.dataValues, senderName });
    res.status(200).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
