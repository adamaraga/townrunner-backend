const router = require("express").Router();
const authJwt = require("../middlewares/authJwt");
// const passport = require("passport")
const {
  signup,
  sentOtp,
  facialVeriSessionId,
  facialVeriResult,
  googleOauthMobile,
  otpVerification,
  update,
} = require("../controllers/auth.controller");
// require("../config/passport");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// To signup a user
router.post("/signup", signup);

// To send otp
router.post("/send-otp", sentOtp);

// To verify otp
router.post("/verify-otp", otpVerification);

// To update user
router.post(
  "/update",
  [authJwt.verifyToken],
  upload.single("uploadedFile"),
  update
);

// To create and send sessionId
router.get("/send-sessionid", facialVeriSessionId);

// To send sessionId Result
router.get("/send-result/:sessionId", facialVeriResult);

// Web redirect flow (optional for web clients)
// router.get("/google", passport.authenticate("google", {
//   scope: ["profile","email"], session: false
// }));

// router.get("/google/callback",
//   passport.authenticate("google",{ session:false, failureRedirect:"/login" }),
//   (req,res) => {
//     const { token } = req.user;
//     res.cookie("jwt", token, { httpOnly:true, secure:true });
//     res.redirect("/dashboard");
//   }
// );

// Google Oauth for mobile
router.get("/google/mobile", googleOauthMobile);

// To login a user
// router.post("/signin", signin);

// To verify email address
// router.put("/email-verify/:token", emailVerification);

// To initiat forget password
// router.post("/forget-password", forgetPassword);

// To reset password from forget password
// router.put("/reset-password-fp", resetPassordFromForgot);

// To change password from dashboard
// router.put("/change-password/:userId", [authJwt.verifyToken], changePassword);

// To update profile from dashboard
// router.put("/update-profile/:userId", [authJwt.verifyToken], update);

module.exports = router;
