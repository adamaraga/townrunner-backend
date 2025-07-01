const { Op } = require("sequelize");
const db = require("../models");

const User = db.users;

exports.getUsers = async (req, res) => {
  const page = req.params.page;
  const limit = req.params.limit ? +req.params.limit : 10;
  const offset = limit * (page - 1);

  try {
    const { count, rows } = await User.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({ users: rows, totalPages, limit });
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getUsersBySearch = async (req, res) => {
  const page = req.params.page;
  const limit = req.params.limit ? +req.params.limit : 10;
  const offset = limit * (page - 1);

  const query = req.params.query;

  try {
    const { count, rows } = await User.findAndCountAll({
      where: {
        [Op.or]: [
          {
            firstName: {
              [Op.like]: "%" + query + "%",
            },
          },
          {
            lastName: {
              [Op.like]: "%" + query + "%",
            },
          },
          {
            id: {
              [Op.like]: "%" + query + "%",
            },
          },
        ],
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({ users: rows, totalPages, limit });
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getUsersChat = async (req, res) => {
  try {
    const user = await User.findAll({
      attributes: ["id", "firstName", "lastName", "title"],
    });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
};
