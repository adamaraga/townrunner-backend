const webhookCtrl = require("../controllers/webhook.controller");
const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();

// Add user Account Details
router.post("/webhook", [authJwt.verifyToken], webhookCtrl.paystackWebhook);

module.exports = router;
