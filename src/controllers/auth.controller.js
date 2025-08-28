const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models");
const sendMail = require("../middlewares/SendMail");
const generator = require("generate-password");
const { sendOTP } = require("../middlewares/sendOTP");
const { Op } = require("sequelize");
const {
  RekognitionClient,
  CreateFaceLivenessSessionCommand,
  CreateCollectionCommand,
  GetFaceLivenessSessionResultsCommand,
  IndexFacesCommand,
  DeleteFacesCommand,
  SearchFacesByImageCommand,
} = require("@aws-sdk/client-rekognition");
const { OAuth2Client } = require("google-auth-library");

const User = db.users;
const Confirmation = db.confirmations;
const Facial = db.facials;

const getRekognitionClient = () => {
  const rekognitionClient = new RekognitionClient({
    region: process.env.AWS_REGION || "eu-west-1",
  });
  // const rekognitionClient = new Rekognition({
  //   region: "eu-west-1",
  // });

  return rekognitionClient;
};

const SALT_ROUNDS = 10;

const COLLECTION_ID = process.env.REKOG_COLLECTION || "riders_collection";
const LIVENESS_CONFIDENCE_THRESHOLD =
  Number(process.env.LIVENESS_CONFIDENCE_THRESHOLD) || 70;
const FACE_MATCH_THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD) || 90;

// helper: coerce AuditImage bytes to Buffer
function auditImageToBuffer(auditImage) {
  if (!auditImage) return null;
  // SDK may give Buffer or base64 string; handle both
  if (auditImage.Bytes) {
    if (Buffer.isBuffer(auditImage.Bytes)) return auditImage.Bytes;
    // if it is a base64 string
    try {
      return Buffer.from(auditImage.Bytes, "base64");
    } catch (e) {
      return null;
    }
  }
  return null;
}

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
    // if (req.body.type === "login" && !existingUser) {
    //   return res
    //     .status(200)
    //     .json({ warningMessage: "User not found, please signup" });
    // }

    // if (req.body.type === "signup" && existingUser) {
    //   return res.status(200).json({ warningMessage: "Please login" });
    // }

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
  const { phone, otp } = req.body;
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

    const user = await User.findOne({
      where: {
        phone,
      },
    });

    if (user) {
      // const user = await User.findOne({
      //   where: { phone },
      // });

      // if (!user) {
      //   return res
      //     .status(404)
      //     .json({ success: false, message: "User not found, please signup" });
      // }

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

// create collection (run once)
exports.createFacialCollection = async (req, res) => {
  try {
    const rek = getRekognitionClient();
    await rek.send(
      new CreateCollectionCommand({ CollectionId: COLLECTION_ID })
    );
    return res.status(200).json({ ok: true, collectionId: COLLECTION_ID });
  } catch (err) {
    console.error("createCollection error:", err);
    // if already exists, Rekognition returns an error — handle gracefully
    return res.status(500).json({ error: err.message || err });
  }
};

exports.facialVeriSessionId = async (req, res) => {
  try {
    const rek = getRekognitionClient();
    const response = await rek.send(new CreateFaceLivenessSessionCommand({}));

    res.status(200).json({ sessionId: response.SessionId });
  } catch (err) {
    // console.log("err", err);
    res.status(500).json({ error: err.message });
  }
};

// enroll Facial
exports.facialRegistration = async (req, res) => {
  try {
    const riderUserId = req.params.userId;
    const sessionId = req.params.sessionId;
    if (!sessionId || !riderUserId)
      return res.status(400).json({ message: "sessionId and userID required" });

    const rek = getRekognitionClient();
    const getRes = await rek.send(
      new GetFaceLivenessSessionResultsCommand({
        SessionId: sessionId,
      })
    );
    console.log("Liveness raw:", JSON.stringify(getRes, null, 2));
    // const getRessss = await rek.getFaceLivenessSessionResults({
    //   SessionId: sessionId,
    // });
    // check liveness confidence
    const confidence = getRes.Confidence ?? 0;
    console.log("confidence", confidence);
    if (confidence < LIVENESS_CONFIDENCE_THRESHOLD) {
      return res.status(400).json({ message: "Liveness check failed" });
    }

    const auditImages = getRes.AuditImages || [];
    if (!auditImages.length) {
      return res.status(400).json({ message: "No audit images returned." });
    }

    // choose first audit image with Bytes
    const chosen = auditImages.find((img) => img.Bytes) || auditImages[0];
    const imageBuffer = auditImageToBuffer(chosen);
    if (!imageBuffer) {
      return res.status(500).json({ message: "Could not extract image" });
    }

    // Index face
    const indexCmd = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      ExternalImageId: riderUserId,
      Image: { Bytes: imageBuffer },
      MaxFaces: 1,
    });
    const indexRes = await rek.send(indexCmd);

    const faceRecord = indexRes.FaceRecords?.[0]?.Face;
    if (!faceRecord) {
      return res.status(500).json({ message: "No facial Record" });
    }

    const faceId = faceRecord.FaceId;

    // persist minimal data
    await Facial.create({
      riderUserId,
      faceId,
      collectionId: COLLECTION_ID,
    });

    return res.status(200).json({ ok: true, faceId, confidence });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// exports.facialVeriResult = async (req, res) => {
//   if (!req.params.sessionId) {
//     return res.status(400).json({ error: "Missing sessionId" });
//   }

//   try {
//     const rekognition = getRekognitionClient();
//     const response = await rekognition.getFaceLivenessSessionResults({
//       SessionId: req.params.sessionId,
//     });

//     const isLive = response.Confidence > 70;

//     res.status(200).json({ isLive, response });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// 4) verify: use sessionId -> getFaceLivenessSessionResults -> SearchFacesByImage (Image.Bytes)
exports.verifyFacial = async (req, res) => {
  try {
    const riderUserId = req.params.userId;
    const sessionId = req.params.sessionId;
    if (!sessionId || !riderUserId)
      return res.status(400).json({ message: "sessionId and userID required" });

    const rek = getRekognitionClient();
    const getRes = await rek.send(
      new GetFaceLivenessSessionResultsCommand({
        SessionId: sessionId,
      })
    );

    const confidence = getRes.Confidence ?? 0;
    if (confidence < LIVENESS_CONFIDENCE_THRESHOLD) {
      return res.status(400).json({ message: "Liveness check failed" });
    }

    const auditImages = getRes.AuditImages || [];
    if (!auditImages.length) {
      return res.status(400).json({ message: "No audit images returned." });
    }

    const chosen = auditImages.find((img) => img.Bytes) || auditImages[0];
    const imageBuffer = auditImageToBuffer(chosen);
    if (!imageBuffer) {
      return res.status(500).json({ error: "Could not extract image" });
    }

    const searchCmd = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      FaceMatchThreshold: FACE_MATCH_THRESHOLD,
      MaxFaces: 1,
    });

    const searchRes = await rek.send(searchCmd);
    const match = searchRes.FaceMatches?.[0] || null;
    if (!match) {
      return res.status(200).json({ message: "No facial match" });
    }

    const similarity = match.Similarity;
    const matchedExternalId = match.Face?.ExternalImageId;

    const verified =
      String(matchedExternalId) === String(riderUserId) &&
      similarity >= FACE_MATCH_THRESHOLD;

    return res
      .status(200)
      .json({ verified, similarity, matchedExternalId, confidence });
  } catch (err) {
    console.error("verify error:", err);
    return res.status(500).json({ error: err.message || err });
  }
};

exports.googleOauthMobile = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "idToken is required" });
  }

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    //Verify id_token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, family_name, given_name } = payload;

    // Find or create user
    let user = await User.findOne({ where: { googleId: sub } });
    // const referralCode = generator.generate({
    //   length: 6,
    //   numbers: true,
    // });

    if (!user) {
      let userWithEmail = await User.findOne({ where: { email } });

      if (!userWithEmail) {
        return res.status(200).json({
          firstName: given_name,
          lastName: family_name,
          email: email,
        });
      }

      userWithEmail.googleId = sub;
      await userWithEmail.save();

      const token = jwt.sign(
        { id: userWithEmail.id.toString() },
        process.env.SECRET_KEY,
        {}
      );

      res.status(200).json({
        ...userWithEmail?.dataValues,
        accessToken: token,
      });
      // user = await User.create({
      //   googleId: sub,
      //   firstName: given_name,
      //   lastName: family_name,
      //   email: email,
      //   image: picture,
      //   referralCode,
      //   referralCodeInvite,
      // });
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

// exports.getUser = async (req, res) => {
//   try {
//     const user = await User.findByPk(req.params.userId);
//     if (!user) return res.status(404).json({ message: "User Not found" });
//     res.json({ user });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.deleteUser = async (req, res) => {
  if (req.body.url) {
    fs.unlinkSync(`./${req.body.url}`);
  }

  try {
    if (!req.userId)
      return res.status(400).json({ message: "userId is required" });

    // find face records
    const record = await Facial.findOne({ where: { riderUserId: req.userId } });

    if (record) {
      await rek.send(
        new DeleteFacesCommand({
          CollectionId: COLLECTION_ID,
          FaceIds: record.faceId,
        })
      );
      await Facial.destroy({ where: { riderUserId: req.userId } });
    }

    // delete DB rows
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
