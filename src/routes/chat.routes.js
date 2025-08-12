const chatCtrl = require("../controllers/chat.controller");

const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();

router.post("/get-or-create", [authJwt.verifyToken], chatCtrl.getOrCreateChat);
router.get("/:chatId/messages", [authJwt.verifyToken], chatCtrl.getMessages);
router.get(
  "/:deliveryId/:role/unReadCount",
  [authJwt.verifyToken],
  chatCtrl.getUnReadCount
);
router.post("/:chatId/message", [authJwt.verifyToken], chatCtrl.sendMessage);
router.patch(
  "/:chatId/updateReadCount",
  [authJwt.verifyToken],
  chatCtrl.updateReadCount
);

module.exports = router;
