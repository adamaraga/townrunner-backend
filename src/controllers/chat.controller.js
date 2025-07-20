const db = require("../models");
const Chat = db.chats;
const Message = db.messages;

// Create or get chat for delivery/user context
exports.getOrCreateChat = async (req, res) => {
  const { deliveryId } = req.body;
  try {
    let chat = await Chat.findOne({ where: { deliveryId } });
    if (!chat) chat = await Chat.create({ deliveryId });
    res.json(chat);
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
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add message
exports.sendMessage = async (req, res) => {
  const { chatId, text } = req.body;
  const senderId = req.userId;
  try {
    const message = await Message.create({ chatId, senderId, text });
    // emit via socket
    req.io.to(`chat_${chatId}`).emit("newMessage", message);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
