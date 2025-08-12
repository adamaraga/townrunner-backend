const db = require("../models");
const Call = db.calls;
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
// Simplified token generation using agora-access-token
const { RtcTokenBuilder, RtcRole } = require("agora-token");
// Generate Agora token on server using App Certificate directly
function generateAgoraToken(channelName, uid = 0) {
  const appId = process.env.AGORA_APP_ID;
  const appCert = process.env.AGORA_SECRET;
  const role = RtcRole.PUBLISHER;
  const expireTime = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTime;
  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCert,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );
}

// Create a new call
exports.createCall = async (req, res) => {
  try {
    const { calleeId, callerName } = req.body;
    const callerId = req.userId;
    const channelName = `call_${uuidv4()}`;
    const token = generateAgoraToken(channelName);
    const session = await Call.create({
      callerId,
      calleeId,
      channelName,
      token,
    });
    // notify callee via socket
    req.io.to(calleeId).emit("incomingCall", {
      id: session.id,
      channelName,
      callerId,
      callerName,
      token,
    });
    res.status(200).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get session token (if needed separately)
exports.getToken = async (req, res) => {
  try {
    const session = await Call.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res
      .status(200)
      .json({ channelName: session.channelName, token: session.token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// End call
exports.endCall = async (req, res) => {
  try {
    const session = await Call.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    session.status = "ended";
    await session.save();
    req.io.to(session.channelName).emit("callEnded", { sessionId: session.id });
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
