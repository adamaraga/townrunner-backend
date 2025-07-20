const paymentCtrl = require("../controllers/payment.controller");
const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();

// Initialize Paystack transaction
router.post("/init", [authJwt.verifyToken], paymentCtrl.initPayment);

// Callback redirect from WebView or manual verify
router.get(
  "/verify/:reference",
  [authJwt.verifyToken],
  paymentCtrl.verifyPayment
);

module.exports = router;
