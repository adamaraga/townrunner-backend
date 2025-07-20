const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.users;

verifyToken = (req, res, next) => {
  let accesstoken = req.headers["authorization"];
  // console.log(req.headers);

  if (!accesstoken?.startsWith("Bearer ")) {
    return res.status(403).json({ message: "No token provided!" });
  }

  const accessTokenParts = accesstoken.split(" ");
  const token = accessTokenParts[1];

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        message: "Unauthorized!",
      });
    }
    req.userId = decoded.id;

    next();
  });
};

isAdmin = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.userId },
    });

    if (user.role !== "admin") {
      res.status(403).json({ message: "Require Admin Role!" });
      return;
    }

    next();
    return;
  } catch (error) {
    res.status(500).json(error);
  }
};

isRider = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.userId },
    });

    if (user.role !== "rider") {
      res.status(403).json({ message: "Require Rider Role!" });
      return;
    }

    next();
    return;
  } catch (error) {
    res.status(500).json(error);
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  isRider,
};

module.exports = authJwt;
