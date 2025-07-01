const {
  sendChatMessage,
  getChatMessages,
  getConversationPar,
} = require("../controllers/chat.controller");
const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();

router.post("/send", [authJwt.verifyToken], sendChatMessage);

router.get(
  "/all/:userId/:conversationId",
  [authJwt.verifyToken],
  getChatMessages
);

router.get("/conversation/:userId", [authJwt.verifyToken], getConversationPar);

module.exports = router;
