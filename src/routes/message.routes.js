const {
  addMessage,
  getMessages,
} = require("../controllers/message.controller");
const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();

router.post("/add", [authJwt.verifyToken, authJwt.isAdminOrHr], addMessage);

router.get("/all/:page", [authJwt.verifyToken], getMessages);

module.exports = router;
