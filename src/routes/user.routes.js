const {
  getUsers,
  getUser,
  getUsersBySearch,
  getUsersChat,
} = require("../controllers/user.controller");
const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();

router.get(
  "/all/:page/:limit",
  [authJwt.verifyToken, authJwt.isAdmin],
  getUsers
);

// router.get("/all/chat", [authJwt.verifyToken], getUsersChat);

router.get("/:userId", [authJwt.verifyToken, authJwt.isAdmin], getUser);

router.get(
  "/search/:query/:page/:limit",
  [authJwt.verifyToken, authJwt.isAdmin],
  getUsersBySearch
);

module.exports = router;
