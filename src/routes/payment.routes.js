const paymentCtrl = require("../controllers/payment.controller");
const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();

// Initialize Paystack transaction
router.post("/init", [authJwt.verifyToken], paymentCtrl.initPayment);

// get payment transaction
router.get(
  "/transaction",
  [authJwt.verifyToken],
  paymentCtrl.getMyTransactions
);

// get payment transaction
router.get(
  "/transaction/:id",
  [authJwt.verifyToken],
  paymentCtrl.getMyTransaction
);

// get payment transaction
router.post(
  "/wallet/withdraw",
  [authJwt.verifyToken],
  paymentCtrl.walletWithdral
);

// Callback redirect from WebView or manual verify
router.get(
  "/verify/:reference",
  [authJwt.verifyToken],
  paymentCtrl.verifyPayment
);

module.exports = router;
