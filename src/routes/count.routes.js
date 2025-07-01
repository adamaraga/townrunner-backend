const { getCounts } = require("../controllers/count.controller");
const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();

router.get("/dashboard", [authJwt.verifyToken, authJwt.isAdminOrHr], getCounts);

module.exports = router;
