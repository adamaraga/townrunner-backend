const axios = require("axios");
const { addMonths } = require("date-fns");
const db = require("../models");
const Payment = db.payments;

// Initialize transaction (server-side) to get reference
exports.initPayment = async (req, res) => {
  const { amount, email, deliveryId, description, reason, subPeriod } =
    req.body;
  const type = "deposit";
  const amountInKobo = parseInt(amount) * 100;
  try {
    // Call Paystack initialize
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      { amountInKobo, email },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } }
    );

    await Payment.create({
      amount,
      userId: req.userId,
      deliveryId,
      reference: response.data.data.reference,
      status: "pending",
      description,
      type,
      reason,
      subPeriod,
    });

    return res.status(200).json({
      paymentUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.walletWithdral = async (req, res) => {
  const { amount, description } = req.body;
  const type = "withdral";
  try {
    const user = await User.findByPk(payment?.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (parseInt(amount) > parseInt(user.walletBal)) {
      return res.status(500).json({ message: "Insufficient amount in wallet" });
    } else {
      user.walletBal = parseInt(user.walletBal) - parseInt(amount);
      await user.save();
      await Payment.create({
        amount,
        userId: req.userId,
        description,
        type,
        reason: "wallet",
        staus: "success",
      });

      return res.status(200).json({
        message: "Payment Successful",
        status: success,
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Verify transaction
exports.verifyPayment = async (req, res) => {
  const { reference } = req.params;
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } }
    );
    const { status, authorization } = response.data.data;
    const payment = await Payment.findOne({ where: { reference } });
    if (!payment)
      return res.status(404).json({ message: "Payment record not found" });

    payment.status = status === "success" ? "success" : "failed";
    await payment.save();

    if (status !== "success") {
      res.status(200).json({ status: payment.status, reference });
    }

    if (payment?.reason === "delivery") {
      if (payment.deliveryId && payment.status === "success") {
        const Delivery = db.deliveries;
        const delivery = await Delivery.findByPk(payment.deliveryId);
        if (!delivery) {
          return res.status(404).json({ message: "Delivery not found" });
        }
        delivery.paymentStatus = "paid";
        await delivery.save();
        req.io.emit("delivery:paid", { deliveryId: delivery.id });
      }
    }
    if (payment?.reason === "wallet") {
      const User = db.users;
      const user = await User.findByPk(payment?.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.walletBal = parseInt(user?.walletBal) + parseInt(payment?.amount);
      await user.save();
      req.io.emit("wallet:deposit", { userId: user?.id });
    }
    if (payment?.reason === "subscription") {
      const User = db.users;
      const user = await User.findByPk(payment?.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.subPeriod = payment?.subPeriod;
      user.subAmount = payment?.amount;
      const baseDate = user.subExpiry ? new Date(user.subExpiry) : new Date();
      // Compute the new expiry
      const newExpiry = addMonths(baseDate, subPeriod);

      // Update & persist
      user.subExpiry = newExpiry;
      user.subStatus = true;
      user.subAuthorizationCode = authorization
        ? authorization.authorization_code
        : null;
      await user.save();
      req.io.emit("subscription:added", { userId: user?.id });
    }

    return res.status(200).json({ status: payment.status, reference });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
