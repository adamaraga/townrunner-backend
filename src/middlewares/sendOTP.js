const axios = require("axios");

const sendOTP = async (phone, otp, channel = "sms") => {
  console.log("payload");
  const payload = {
    senderID: "InfoHub",
    messageText: "Your otp is " + otp,
    deliveryTime: new Date().toISOString(),
    mobileNumber: phone,
    route: "string",
  };

  try {
    const response = await axios.post(
      "https://api.smslive247.com/api/v4/sms", // endpoint URL :contentReference[oaicite:0]{index=0}
      payload,
      {
        headers: {
          Authorization: `Bearer MA-ae1733e8-a273-4c4f-a579-3a87c9c298ea`, // Basic auth :contentReference[oaicite:1]{index=1}
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // API wraps result in a "data" key
    console.log("SMSLive247 response:", response.data);
    return response.data;
  } catch (err) {
    // If the API returns an error payload, it will still come back here
    console.error("Failed to send OTP SMS:", err.response?.data || err.message);
    throw err;
  }
};

module.exports = { sendOTP };
