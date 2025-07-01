const db = require("../models");

const Message = db.messages;

exports.addMessage = async (req, res) => {
  try {
    const message = await Message.create(req.body);

    res.status(200).json(message);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getMessages = async (req, res) => {
  const page = req.params.page;
  const limit = req.params.limit ? +req.params.limit : 10;
  const offset = limit * (page - 1);

  try {
    const { count, rows } = await Message.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({ messages: rows, totalPages, limit });
  } catch (err) {
    res.status(500).json(err);
  }
};
