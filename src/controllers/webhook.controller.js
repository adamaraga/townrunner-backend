const db = require("../models");

const { sequelize } = db;
const Payment = db.payments;
const User = db.users;
const Delivery = db.deliveries;

exports.paystackWebhook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body?.event;
    if (!event) {
      return res.status(400).send("No event");
    }
    if (
      event === "transfer.success" ||
      event === "transfer.reversed" ||
      event === "transfer.failed"
    ) {
      const data = req.body?.data;
      const reference =
        data?.reference ||
        data?.transfer_reference ||
        (data?.transfer && data?.transfer?.reference);

      const status =
        data.status ||
        (event === "transfer.success"
          ? "success"
          : event === "transfer.reversed"
          ? "reversed"
          : "failed");
      // if (!reference) return res.status(200).send('no-reference');

      await sequelize.transaction(async (t) => {
        let payment = null;
        if (reference) {
          payment = await Payment.findOne({
            where: { reference },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
        }

        if (
          !payment &&
          (data.transfer_code || (data.transfer && data.transfer.transfer_code))
        ) {
          const tc = data.transfer_code || data.transfer.transfer_code;
          payment = await Payment.findOne({
            where: { transfer_code: tc },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
        }

        if (!payment) {
          console.log(
            "Webhook: Payment record not found for reference/transfer_code",
            { reference, transfer_code: data.transfer_code }
          );
          return res.status(200).send("ok"); // ack so Paystack stops retrying
        }

        if (payment.status === status) {
          return res.status(200).send("ok");
        }

        payment.status = status;

        await payment.save({ transaction: t });

        if (
          (status === "reversed" || status === "failed") &&
          !payment.refunded
        ) {
          const user = await User.findByPk(payment.userId, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          if (user) {
            user.walletBal =
              parseFloat(user.walletBal || 0) + parseFloat(payment.amount || 0);
            await user.save({ transaction: t });

            payment.refunded = true;
            await payment.save({ transaction: t });
          } else {
            console.log("Webhook refund: user not found", payment.userId);
          }
        }
      });
    }

    if (event === "charge.success") {
      const data = req.body?.data;
      const reference = data?.reference;
      const status = data.status || "success";

      await sequelize.transaction(async (t) => {
        let payment = null;
        if (reference) {
          payment = await Payment.findOne({
            where: { reference },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
        }

        if (!payment) {
          console.log(
            "Webhook: Payment record not found for reference/transfer_code",
            { reference, transfer_code: data.transfer_code }
          );
          return res.status(200).send("ok"); // ack so Paystack stops retrying
        }

        if (payment.status === status) {
          return res.status(200).send("ok");
        }

        payment.status = status;

        await payment.save({ transaction: t });

        if (payment?.reason === "delivery") {
          if (payment.deliveryId && payment.status === "success") {
            const delivery = await Delivery.findByPk(payment.deliveryId, {
              transaction: t,
              lock: t.LOCK.UPDATE,
            });
            if (!delivery) {
              return res.status(200).send("ok");
            }

            delivery.paymentStatus = "paid";
            await delivery.save({ transaction: t });

            // req.io.emit("delivery:paid", { deliveryId: delivery.id });
            req.io
              .to(`delivery_${delivery.id}`)
              .emit("deliveryUpdate", delivery);
          }
        }
        if (payment?.reason === "wallet") {
          const user = await User.findByPk(payment?.userId, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });

          if (!user) {
            return res.status(200).send("ok");
          }
          user.walletBal =
            parseFloat(user?.walletBal) + parseFloat(payment?.amount);
          await user.save({ transaction: t });
        }
      });
    }

    return res.status(200).send("ok");
  } catch (err) {
    return res.status(500).send("server error");
  }
};
