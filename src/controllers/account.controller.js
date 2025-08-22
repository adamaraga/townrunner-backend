const db = require("../models");
const axios = require("axios");

const { sequelize } = db;
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
    const { name, account_number, bank_code, bank_name, role } = req.body;

    if (!name || !account_number || !bank_code) {
      return res
        .status(400)
        .json({ message: "name, account_number and bank_code are required" });
    }
    if (role !== "rider") {
      return res
        .status(401)
        .json({ message: "Must be a rider to add account" });
    }

    // 1) create recipient on Paystack
    const paystackResp = await createPaystackRecipient({
      name,
      account_number,
      bank_code,
    });

    // console.log("first", account_number);

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
    });

    await account.save();
    account.recipient_code = "";

    res.status(200).json(account);
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

    res.status(200).json({ banks: banks?.data?.data });
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getMyAccounts = async (req, res) => {
  const page = 1;
  const limit = 3;
  const offset = (page - 1) * limit;

  try {
    if (!req.userId) {
      return res.status(500).json({ message: "Authentication error" });
    }

    const { count, rows } = await Account.findAndCountAll({
      where: {
        userId: req.userId,
      },
      attributes: { exclude: ["recipient_code"] },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ accounts: rows, total: count, page, limit });
  } catch (err) {
    res.status(500).json(err);
  }
};

// exports.payRider = async (req, res) => {
//   try {
//     const { accountId, amount_naira } = req.body;
//     if (!accountId || !amount_naira) {
//       return res
//         .status(400)
//         .json({ error: "accountId and amount_naira are required" });
//     }

//     const account = await Account.findByPk(accountId);

//     if (!account)
//       return res.status(404).json({ message: "UserAccount not found" });

//     if (!account.recipient_code)
//       return res
//         .status(400)
//         .json({ error: "recipient_code missing for account" });

//     const user = await User.findByPk(req.userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (parseFloat(amount_naira) > parseFloat(user.walletBal)) {
//       return res.status(500).json({
//         message: "Insufficient amount in wallet",
//         walletBal: user.walletBal,
//       });
//     }

//     user.walletBal = parseFloat(user.walletBal) - parseFloat(amount_naira);

//     const amount = Number(amount_naira) * 100; // Naira -> kobo
//     const reference = `rider_${Date.now()}`;

//     // Initiate transfer
//     const payload = {
//       source: "balance",
//       amount,
//       recipient: account.recipient_code,
//       reason: "Rider payout",
//       reference,
//     };
//     const initResp = await paystack.post("/transfer", payload);

//     const initData = initResp.data?.data || null;

//     if (!initData) {
//       return res
//         .status(500)
//         .json({ message: "Error initiating transfer", raw: initResp.data });
//     }

//     const payment = await Payment.build({
//       amount: amount_naira,
//       userId: req.userId,
//       reference,
//       description: "Rider payout",
//       type: "withdraw",
//       reason: "wallet",
//     });

//     const transfer_code =
//       initData.transfer_code || initData.transfer?.transfer_code;

//     // If user provided otp in same request, finalize immediately
//     // finalize
//     const finalizeResp = await paystack.post("/transfer/finalize_transfer", {
//       transfer_code,
//     });

//     if (finalizeResp?.data?.data?.status !== "success") {
//       return res
//         .status(500)
//         .json({ message: "Payout Failed, please try again later" });
//     }

//     await user.save();
//     await payment.save();

//     res.status(200).json({
//       success: true,
//     });
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

exports.payRider = async (req, res) => {
  const { accountId, amount_naira } = req.body;
  if (!accountId || !amount_naira)
    return res
      .status(400)
      .json({ message: "accountId and amount_naira are required" });

  // convert to integer kobo
  const amountKobo = Math.round(Number(amount_naira) * 100);

  try {
    const result = await sequelize.transaction(async (t) => {
      // Lock the user row so two concurrent payouts cannot overdraft
      const user = await User.findByPk(req.userId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!user) throw { status: 404, message: "User not found" };

      if (parseFloat(user.walletBal) * 100 < amountKobo) {
        throw { status: 400, message: "Insufficient wallet balance" };
      }

      const account = await Account.findByPk(accountId, { transaction: t });
      if (!account) throw { status: 404, message: "Account not found" };
      if (!account.recipient_code)
        throw { status: 400, message: "recipient_code missing for account" };

      // Deduct user's wallet balance (do this in DB-tran)
      // store walletBal as number in DB: you might need to handle parsing/formatting
      user.walletBal = parseFloat(user.walletBal) - parseFloat(amount_naira);
      await user.save({ transaction: t });

      // create Payment row with reference and transfer_code placeholder
      const reference = `rider_${Date.now()}`;
      const payment = await Payment.create(
        {
          amount: amount_naira, // or amount_kobo if you store integers
          userId: req.userId,
          reference,
          description: "Rider payout",
          type: "withdraw",
          reason: "wallet",
          // status: 'initiated',
        },
        { transaction: t }
      );

      // Initiate transfer outside transaction or inside? You can call Paystack here.
      // However if Paystack call is slow, you might prefer to perform it after committing DB changes.
      // Below I call Paystack synchronously (but we still use t for DB changes).
      // Note: if Paystack fails after the DB commit, you'll need reconciliation logic / webhook.

      const payload = {
        source: "balance",
        amount: amountKobo,
        recipient: account.recipient_code,
        reason: "Rider payout",
        reference,
      };
      const initResp = await paystack.post("/transfer", payload);

      const initData = initResp.data?.data;
      if (!initData)
        throw {
          status: 500,
          message: "Error initiating transfer",
          raw: initResp.data,
        };

      const transfer_code =
        initData.transfer_code || initData.transfer?.transfer_code;
      // save transfer_code on payment (still inside same transaction)
      if (!transfer_code) {
        throw {
          status: 500,
          message: "Error initiating transfer",
        };
      }
      console.log("transfer_code", transfer_code);
      payment.transfer_code = transfer_code;
      await payment.save({ transaction: t });

      // If finalize required:
      const finalizeResp = await paystack.post("/transfer/finalize_transfer", {
        transfer_code,
      });
      //   if (finalizeResp?.data?.data?.status === "failed" || finalizeResp?.data?.data?.status === "failed") {
      //     // You may choose to throw here to rollback the DB changes.
      //     // But note: if you rollback, you have to handle undoing any remote changes Paystack already did.
      //     throw { status: 500, message: "Payout finalize failed" };
      //   }

      return { success: true, walletBal: user?.walletBal };
    }); // managed transaction ends

    res.status(200).json(result);
  } catch (err) {
    // console.log("err", err);
    res.status(500).json(err);
  }
};

// exports.verifyPayRider = async (req, res) => {
//   const { reference } = req.params;

//   try {
//     if (!reference)
//       return res.status(400).json({ error: "reference required" });

//     const payment = await Payment.findOne({ where: { reference } });
//     if (!payment) {
//       return res.status(404).json({ message: "Payment record not found" });
//     }

//     if (payment.status === "success") {
//       return res.status(200).json({ status: payment.status, reference });
//     }

//     const response = await paystack.get(`/transfer/verify/${reference}`);
//     const { status } = response.data.data;

//     payment.status = status;
//     await payment.save();

//     if (status === "reversed") {
//       const user = await User.findByPk(req.userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       user.walletBal = parseFloat(user.walletBal) + parseFloat(payment.amount);

//       await user.save();
//     }

//     return res.status(200).json({ status: payment.status, reference });
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

exports.verifyPayRider = async (req, res) => {
  const { reference } = req.params;
  if (!reference) return res.status(400).json({ error: "reference required" });

  try {
    // 1) Fetch current payment outside or inside transaction? We'll do inside transaction with lock.
    const response = await paystack.get(`/transfer/verify/${reference}`);
    const status = response.data?.data?.status;

    if (!status)
      return res.status(500).json({ message: "No status from paystack" });

    await sequelize.transaction(async (t) => {
      // lock payment row
      const payment = await Payment.findOne({
        where: { reference },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!payment) throw { status: 404, message: "Payment record not found" };

      // if already set to same status, nothing to do
      if (payment.status === status) return;

      // update payment status
      payment.status = status;
      await payment.save({ transaction: t });

      // If reversed => refund
      if ((status === "reversed" || status === "failed") && !payment.refunded) {
        const user = await User.findByPk(payment.userId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!user) throw { status: 404, message: "User not found" };

        user.walletBal =
          parseFloat(user.walletBal || 0) + parseFloat(payment.amount || 0);
        await user.save({ transaction: t });
        payment.refunded = true;
        await payment.save({ transaction: t });
      }
    });

    res.status(200).json({ status, reference });
  } catch (err) {
    res.status(500).json(err);
  }
};
