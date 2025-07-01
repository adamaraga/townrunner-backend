const db = require("../models");

const User = db.users;
const Career = db.career;
const Training = db.training;

exports.getCounts = async (req, res) => {
  try {
    const userCount = await User.count();
    const trainingCount = await Career.count();
    const careerCount = await Training.count();

    res.status(200).json({ userCount, trainingCount, careerCount });
  } catch (err) {
    res.status(500).json(err);
  }
};
