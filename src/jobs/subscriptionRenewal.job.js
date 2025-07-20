// jobs/subscriptionRenewal.job.js
const cron = require("node-cron");
const axios = require("axios");
const { Op } = require("sequelize");
const db = require("../models");
const User = db.users;
const Payment = db.payments;

// run at 00:30 every day
cron.schedule("30 0 * * *", async () => {
  const now = new Date();

  // fetch everyone with an active or past_due subscription
  // and a real subExpiry + auth code
  const candidates = await User.findAll({
    where: {
      //   authorizationCode: { [Op.ne]: null },
      subExpiry: { [Op.ne]: null },
      subStatus: { [Op.in]: ["active", "past_due"] },
    },
  });

  for (const user of candidates) {
    const expiry = new Date(user.subExpiry);
    const diffMs = now - expiry;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      // not yet time to retry
      continue;
    }

    if (diffDays > 5) {
      // 5+ days past expiry → give up and deactivate
      if (user.subStatus !== "inactive") {
        user.subStatus = "inactive";
        await user.save();
        // console.log(`Subscription for user ${user.id} marked INACTIVE (expired >5 days ago).`);
      }
      continue;
    }

    if (!user.subAuthorizationCode) {
      if (user.subStatus !== "past_due") {
        user.subStatus = "past_due";
        await user.save();
      }
      continue;
    }

    try {
      // Charge via Paystack
      const resp = await axios.post(
        "https://api.paystack.co/transaction/charge_authorization",
        {
          authorization_code: user.subAuthorizationCode,
          email: user.email,
          amount: user.subAmount * 100, // in kobo
        },
        {
          headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
        }
      );

      const { status, reference } = resp.data.data;

      await Payment.create({
        amount: user.subAmount,
        userId: req.userId,
        reference,
        status,
        description: "Renewal of Subscription",
        type: "deposit",
        reason: "subscription",
        subPeriod: user.subPeriod,
      });

      if (status === "success") {
        // bump expiry
        const baseDate = new Date(user.subExpiry);
        const newExpiry = new Date(
          baseDate.setMonth(baseDate.getMonth() + user.subPeriod)
        );
        user.subExpiry = newExpiry;
        user.subStatus = "active";
        await user.save();
        // console.log(`✔️  Subscription renewed for ${user.id}. New expiry: ${newExpiry.toISOString().slice(0,10)}`);
      } else {
        user.subStatus = "past_due";
        user.subStatus = "past_due";
        await user.save();
        // console.log(`❌ Attempt ${diffDays}/5 failed for ${user.id}. Will retry tomorrow.`);
      }
    } catch (err) {
      user.subStatus = "past_due";
      await user.save();
      //   console.error(`🔄 Retry error for ${user.id} (day ${diffDays}):`, err.response?.data || err.message);
    }
  }
});
