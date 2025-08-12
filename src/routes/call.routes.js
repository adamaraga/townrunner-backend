const callCtrl = require("../controllers/call.controller");

const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();

router.post("/create", [authJwt.verifyToken], callCtrl.createCall);
router.get("/token/:id", [authJwt.verifyToken], callCtrl.getToken);
router.post("/end/:id", [authJwt.verifyToken], callCtrl.endCall);

module.exports = router;
