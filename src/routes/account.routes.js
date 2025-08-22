const accountCtrl = require("../controllers/account.controller");
const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();

// Add user Account Details
router.post("/add", [authJwt.verifyToken], accountCtrl.createAccount);

// Get banks
router.get("/banks", [authJwt.verifyToken], accountCtrl.getBanks);

// Get my account
router.get("/myAccounts", [authJwt.verifyToken], accountCtrl.getMyAccounts);

// Pay rider
router.post("/riderPayout", [authJwt.verifyToken], accountCtrl.payRider);

// Verify Rider Payout
router.get(
  "/verifyPayout/:reference",
  [authJwt.verifyToken],
  accountCtrl.verifyPayRider
);

module.exports = router;
