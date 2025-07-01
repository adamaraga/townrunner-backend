const db = require("../models");
const { getReceiverSocketId, io } = require("../socket/socket");

const Chat = db.chat;
const Conversation = db.conversation;
const Participant = db.participant;
const User = db.users;

exports.sendChatMessage = async (req, res) => {
  try {
    const participant = await Participant.findOne({
      where: { userId: req.body.userId, otherUserId: req.body.otherUserId },
    });

    if (!participant) {
      const conversation = Conversation.build({});

      const participant1 = Participant.build({
        conversationId: conversation.id,
        userId: req.body.userId,
        otherUserId: req.body.otherUserId,
        messageNo: 1,
      });

      const participant2 = Participant.build({
        conversationId: conversation.id,
        userId: req.body.otherUserId,
        otherUserId: req.body.userId,
        messageNo: 1,
        unreadMessage: 1,
      });

      const newChat = Chat.build({
        conversationId: conversation.id,
        senderId: req.body.userId,
        text: req.body.text,
      });

      await conversation.save();
      await participant1.save();
      await participant2.save();
      await newChat.save();

      // SOCKET IO FUNCTIONALITY WILL GO HERE
      const receiverSocketId = getReceiverSocketId(req.body.otherUserId);
      if (receiverSocketId) {
        // io.to(<socket_id>).emit() used to send events to specific client
        io.to(receiverSocketId).emit("newChat", newChat);
      }

      res.status(200).json({ message: "Sent" });
    } else {
      const participant2 = await Participant.findOne({
        where: {
          userId: req.body.otherUserId,
          conversationId: participant.conversationId,
        },
      });

      const newParticipant1 = {
        messageNo: participant2.messageNo + 1,
      };

      const newParticipant2 = {
        messageNo: participant2.messageNo + 1,
        unreadMessage: participant2.unreadMessage + 1,
      };

      const chat = Chat.build({
        conversationId: participant.conversationId,
        senderId: req.body.userId,
        text: req.body.text,
      });

      await chat.save();
      await Participant.update(newParticipant1, {
        where: {
          userId: req.body.userId,
          conversationId: participant.conversationId,
        },
      });
      await Participant.update(newParticipant2, {
        where: {
          userId: req.body.otherUserId,
          conversationId: participant.conversationId,
        },
      });

      // SOCKET IO FUNCTIONALITY WILL GO HERE
      const receiverSocketId = getReceiverSocketId(req.body.otherUserId);
      if (receiverSocketId) {
        // io.to(<socket_id>).emit() used to send events to specific client
        io.to(receiverSocketId).emit("newChat");
      }

      res.status(200).json({ message: "Sent" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const chats = await Chat.findAll({
      where: {
        conversationId: req.params.conversationId,
        // otherUserId: req.params.otherUserId,
      },
      order: [["createdAt", "DESC"]],
    });

    const participant = await Participant.findOne({
      where: {
        userId: req.params.userId,
        conversationId: req.params.conversationId,
      },
    });

    await Participant.update(
      {
        unreadMessage: 0,
      },
      {
        where: {
          userId: req.params.userId,
          conversationId: req.params.conversationId,
        },
        silent: true,
      }
    );

    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getConversationPar = async (req, res) => {
  try {
    const participants = await Participant.findAll({
      where: {
        userId: req.params.userId,
      },
      // include: {
      // model: Users,
      // attributes: ["id", "firstName", "lastName", "title"],
      // required: true,
      // as: "user",
      // },
      include: {
        model: User,
        as: "otherUser",
        attributes: ["id", "firstName", "lastName", "title"],
      },
      order: [["updatedAt", "DESC"]],
    });

    res.status(200).json(participants);
  } catch (err) {
    res.status(500).json(err);
  }
};
