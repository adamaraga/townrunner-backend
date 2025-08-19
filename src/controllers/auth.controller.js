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
  console.log("req.body", req.body);
  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: req.body.email }, { phone: req.body.phone }],
      },
    });

    if (existingUser) {
      if (
        existingUser.email === req.body.email &&
        existingUser.phone === req.body.phone
      ) {
        return res
          .status(409)
          .json({ message: "Email and phone number already in use" });
      } else if (existingUser.email === req.body.email) {
        return res.status(409).json({ message: "Email already in use" });
      } else {
        return res.status(409).json({ message: "Phone number already in use" });
      }
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
      { id: newUser.id.toString() },
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
      ...newUser.dataValues,
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

  try {
    const existingUser = await User.findOne({
      where: {
        phone: req.body.phone,
      },
    });

    if (req.body.type === "login" && !existingUser) {
      return res
        .status(200)
        .json({ warningMessage: "User not found, please signup" });
    }

    if (req.body.type === "signup" && existingUser) {
      return res.status(200).json({ warningMessage: "Please login" });
    }

    await Confirmation.destroy({
      where: {
        phone: req.body.phone,
      },
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    const newConf = Confirmation.build({
      phone: req.body.phone,
      expiresAt,
      otp: bcrypt.hashSync(otp, SALT_ROUNDS),
    });

    // await sendOTP(req.body.phone, otp);

    console.log("otp", otp);

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
    const match = bcrypt.compareSync(otp, confirmation.otp);
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
        return res
          .status(404)
          .json({ success: false, message: "User not found, please signup" });
      }

      const token = jwt.sign(
        { id: user.id.toString() },
        process.env.SECRET_KEY,
        {}
      );

      res.status(200).json({
        ...user?.dataValues,
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
    console.log("first", req.body);
    let user = null;
    if (req.body?.addImage) {
      console.log("req?.file?.path", req?.file?.path);
      if (!req?.file?.path) {
        return res.status(500).json({ message: "Image upload failed" });
      }

      user = await User.findByPk(req.userId);
      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found, update failed" });
      }

      user.phone = req.body?.phone;
      user.firstName = req.body?.firstName;
      user.lastName = req.body?.lastName;
      user.email = req.body?.email;
      user.image = req.file.path;

      await user.save();
      //   {
      //     phone: req.body?.phone,
      //     firstName: req.body?.firstName,
      //     lastName: req.body?.lastName,
      //     email: req.body?.email,
      //     image: req.file.path,
      //   },
      //   {
      //     where: {
      //       id: req.userId,
      //     },
      //   }
      // );
    } else {
      user = await User.findByPk(req.userId);

      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found, update failed" });
      }

      user.phone = req.body?.phone;
      user.firstName = req.body?.firstName;
      user.lastName = req.body?.lastName;
      user.email = req.body?.email;

      await user.save();
    }

    // console.log("user", user);
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePushToken = async (req, res) => {
  try {
    const user = await User.update(
      { notificationPushToken: req.body.token },
      {
        where: {
          id: req.userId,
        },
      }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found, update failed" });
    }

    res.status(200).json({ message: "Update successfull" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateNotification = async (req, res) => {
  const {
    notificationInApp,
    notificationPush,
    notificationEmail,
    notificationPushToken,
  } = req.body;

  try {
    const user = await User.update(
      {
        notificationInApp,
        notificationPush,
        notificationEmail,
        notificationPushToken,
      },
      {
        where: {
          id: req.userId,
        },
      }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found, update failed" });
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
      ...user?.dataValues,
      accessToken: token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  if (req.body.url) {
    fs.unlinkSync(`./${req.body.url}`);
  }

  try {
    await User.destroy({
      where: {
        id: req.userId,
      },
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};
