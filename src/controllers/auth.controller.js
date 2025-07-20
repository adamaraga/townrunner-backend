const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models");
const sendMail = require("../middlewares/SendMail");
const generator = require("generate-password");
const { sendOTP } = require("../middlewares/sendOTP");
const { Op } = require("sequelize");
const { Rekognition } = require("@aws-sdk/client-rekognition");
const { OAuth2Client } = require("google-auth-library");

const getRekognitionClient = () => {
  const rekognitionClient = new Rekognition({
    region: "eu-west-1",
  });

  return rekognitionClient;
};

const User = db.users;
const Confirmation = db.confirmations;

const SALT_ROUNDS = 10;

exports.signup = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: req.body.email },
    });

    if (user) {
      return res.status(500).json({ message: "Email already in use" });
    }

    const referralCode = generator.generate({
      length: 6,
      numbers: true,
    });

    const newUser = User.build({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      referralCode,
      referralCodeInvite: req.body.referralCodeInvite,
    });
    // await sendMail.sendVerificationEmail(
    //   req.body.firstName,
    //   newCon.token.toString(),
    //   req.body.email
    // );

    const token = jwt.sign(
      { id: user.id.toString() },
      process.env.SECRET_KEY,
      {}
    );

    await newUser.save();
    // await newCon.save();

    //  res.status(200).json({
    //   ...newUser,
    //   id: newUser.id,
    //   firstName: newUser.firstName,
    //   lastName: newUser.lastName,
    //   email: newUser.email,
    //   role: newUser.role,
    //   accessToken: token,
    //   image: newUser.image,
    //   phone: newUser.phone,
    //   referralCode: newUser.referralCode,
    //   subStatus: newUser.subStatus,
    //   subExpiry: newUser.subExpiry,
    //   subAmount: newUser.subAmount,
    //   subPeriod: newUser.subPeriod,
    //   notificationPush: newUser.notificationPush,
    //   notificationEmail: newUser.notificationEmail,
    //   notificationInApp: newUser.notificationInApp,
    // });
    res.status(200).json({
      ...newUser,
      accessToken: token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sentOtp = async (req, res) => {
  function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  try {
    await Confirmation.destroy({
      where: {
        phone: req.body.phone,
      },
    });

    const newConf = Confirmation.build({
      phone: req.body.phone,
      expiresAt,
      otp: bcrypt.hashSync(otp, SALT_ROUNDS),
    });

    await sendOTP(req.body.phone, otp);

    await newConf.save();

    res.status(200).json({ success: true, message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.otpVerification = async (req, res) => {
  const { phone, otp, type } = req.body;
  const channel = "sms";

  try {
    const confirmation = await Confirmation.findOne({
      where: {
        phone,
        channel,
        expiresAt: { [Op.gt]: new Date() },
        verified: false,
      },
    });

    if (!confirmation) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Compare provided code with hashed otp
    const match = bcrypt.compareSync(otp, record.otp);
    if (!match) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    confirmation.verified = true;
    await confirmation.save();

    if (type === "login") {
      const user = await User.findOne({
        where: { phone },
      });

      if (!user) {
        res.status(200).json({
          success: true,
          signup: true,
          message: "OTP verification successfull",
        });
      }

      const token = jwt.sign(
        { id: user.id.toString() },
        process.env.SECRET_KEY,
        {}
      );

      res.status(200).json({
        ...user,
        accessToken: token,
      });
    } else {
      res
        .status(200)
        .json({ success: true, message: "OTP verification successfull" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    let user = null;
    if (req.body?.addImage) {
      if (!req?.file?.path) {
        return res.status(500).json({ message: "Image upload failed" });
      }

      user = await User.update(
        { ...req.body, image: req.file.path },
        {
          where: {
            id: req.userId,
          },
        }
      );
    } else {
      user = await User.update(req.body, {
        where: {
          id: req.userId,
        },
      });
    }

    if (!user) {
      res.status(404).json({ message: "User not found, update failed" });
    }

    res.status(200).json({ message: "Update successfull" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.facialVeriSessionId = async (req, res) => {
  try {
    console.log("facial");
    const rekognition = getRekognitionClient();
    const response = await rekognition.createFaceLivenessSession({});

    res.status(200).json({ sessionId: response.SessionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.facialVeriResult = async (req, res) => {
  if (!req.params.sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    const rekognition = getRekognitionClient();
    const response = await rekognition.getFaceLivenessSessionResults({
      SessionId: req.params.sessionId,
    });

    const isLive = response.Confidence > 70;

    res.status(200).json({ isLive, response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.googleOauthMobile = async (req, res) => {
  const { idToken, referralCodeInvite } = req.body;

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    //Verify id_token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, given_name, family_name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ where: { googleId: sub } });
    const referralCode = generator.generate({
      length: 6,
      numbers: true,
    });

    if (!user) {
      user = await User.create({
        googleId: sub,
        firstName: given_name,
        lastName: family_name,
        email: email,
        image: picture,
        referralCode,
        referralCodeInvite,
      });
    }

    const token = jwt.sign(
      { id: user.id.toString() },
      process.env.SECRET_KEY,
      {}
    );

    res.status(200).json({
      ...user,
      accessToken: token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
