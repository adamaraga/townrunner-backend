const db = require("../models");
const axios = require("axios");

const Account = db.accounts;
const Payment = db.payments;
const User = db.users;

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    "Content-Type": "application/json",
  },
});

async function createPaystackRecipient({
  name,
  account_number,
  bank_code,
  currency = "NGN",
}) {
  const payload = {
    type: "nuban",
    name,
    account_number,
    bank_code,
    currency,
  };
  const res = await paystack.post("/transferrecipient", payload);
  return res.data; // contains data.* including recipient_code
}

exports.createAccount = async (req, res) => {
  try {
    const { name, account_number, bank_code, bank_name } = req.body;
    if (!name || !account_number || !bank_code) {
      return res
        .status(400)
        .json({ message: "name, account_number and bank_code are required" });
    }

    // 1) create recipient on Paystack
    const paystackResp = await createPaystackRecipient({
      name,
      account_number,
      bank_code,
    });
    if (!paystackResp || !paystackResp.data) {
      return res
        .status(500)
        .json({ message: "Failed to create recipient on Paystack" });
    }

    const recipient = paystackResp.data;
    // 2) save to DB
    const account = await Account.build({
      userId: req.userId,
      name,
      account_number,
      bank_code,
      bank_name: bank_name,
      currency: "NGN",
      recipient_code: recipient.recipient_code,
      metadata: recipient,
    });

    await account.save();

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.getBanks = async (req, res) => {
  try {
    const banks = await paystack.get("/bank?currency=NGN");

    if (!banks) {
      return res.status(500).json({ message: "error fetching banks" });
    }

    return res.status(200).json({ banks: banks?.data?.data });
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.payRider = async (req, res) => {
  try {
    const { accountId, amount_naira } = req.body;
    if (!accountId || !amount_naira) {
      return res
        .status(400)
        .json({ error: "accountId and amount_naira are required" });
    }

    const account = await Account.findByPk(accountId);

    if (!account)
      return res.status(404).json({ message: "UserAccount not found" });

    if (!account.recipient_code)
      return res
        .status(400)
        .json({ error: "recipient_code missing for account" });

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (parseFloat(amount_naira) > parseFloat(user.walletBal)) {
      return res.status(500).json({
        message: "Insufficient amount in wallet",
        walletBal: user.walletBal,
      });
    }

    user.walletBal = parseFloat(user.walletBal) - parseFloat(amount_naira);

    const amount = Number(amount_naira) * 100; // Naira -> kobo
    const reference = `rider_${Date.now()}`;

    // Initiate transfer
    const payload = {
      source: "balance",
      amount,
      recipient: account.recipient_code,
      reason: "Rider payout",
      reference,
    };
    const initResp = await paystack.post("/transfer", payload);

    const initData = initResp.data?.data || null;

    if (!initData) {
      return res
        .status(500)
        .json({ message: "Error initiating transfer", raw: initResp.data });
    }

    const payment = await Payment.build({
      amount: amount_naira,
      userId: req.userId,
      reference,
      description: "Rider payout",
      type: "withdraw",
      reason: "wallet",
    });

    const transfer_code =
      initData.transfer_code || initData.transfer?.transfer_code;

    // If user provided otp in same request, finalize immediately
    // finalize
    const finalizeResp = await paystack.post("/transfer/finalize_transfer", {
      transfer_code,
    });

    if (finalizeResp?.data?.data?.status !== "success") {
      return res
        .status(500)
        .json({ message: "Payout Failed, please try again later" });
    }

    await user.save();
    await payment.save();

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.verifyPayRider = async (req, res) => {
  const { reference } = req.params;

  try {
    if (reference) return res.status(400).json({ error: "reference required" });

    const payment = await Payment.findOne({ where: { reference } });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (payment.status === "success") {
      return res.status(200).json({ status: payment.status, reference });
    }

    const response = await paystack.get(`/transfer/verify/${reference}`);
    const { status } = response.data.data;

    payment.status = status;
    await payment.save();

    if (status === "reversed") {
      const user = await User.findByPk(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.walletBal = parseFloat(user.walletBal) + parseFloat(payment.amount);

      user.save();
    }

    return res.status(200).json({ status: payment.status, reference });
  } catch (err) {
    res.status(500).json(err);
  }
};
