const db = require("../models");
const Delivery = db.deliveries;
const User = db.users;
const Payment = db.payments;
const { isBadWeather } = require("../utils/weather");
const { calculateDeliveryPrice } = require("../utils/mapUtils");

// Create a new delivery request
exports.createDelivery = async (req, res) => {
  function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  try {
    const {
      originLat,
      originLng,
      distance,
      duration,
      stopsCount,
      stopLat,
      stop2Lat,
    } = req.body;

    // check weather at pickup point (or average of all points)
    const bad = await isBadWeather(originLat, originLng);

    const { price, riderPay } = calculateDeliveryPrice({
      distanceKm: distance,
      durationMin: duration,
      stopsCount,
      date: new Date(),
      isBadWeather: bad,
    });

    //   const otp = generateOtp();
    const delivery = await Delivery.create({
      ...req.body,
      price,
      destinationOtp: generateOtp(),
      pickupOtp: generateOtp(),
      stopOtp: stopLat ? generateOtp() : null,
      stop2Otp: stop2Lat ? generateOtp() : null,
      userId: req.userId,
      riderPay,
    });
    // emit new request via socket
    // req.io.emit("delivery:requested", delivery);
    res.status(200).json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Schedule a new delivery request
exports.scheduleDelivery = async (req, res) => {
  function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  try {
    const { stopLat, stop2Lat, scheduleDateTime } = req.body;

    //   const otp = generateOtp();
    const delivery = await Delivery.create({
      ...req.body,
      price: 0,
      destinationOtp: generateOtp(),
      pickupOtp: generateOtp(),
      stopOtp: stopLat ? generateOtp() : null,
      stop2Otp: stop2Lat ? generateOtp() : null,
      userId: req.userId,
      riderPay: 0,
    });
    // emit new request via socket
    // req.io.emit("delivery:requested", delivery);
    res.status(200).json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get delivery price
exports.getDeliveryPrice = async (req, res) => {
  try {
    const { originLat, originLng, distance, duration, stopsCount } = req.body;
    console.log("req", req.body);

    // check weather at pickup point (or average of all points)
    const bad = await isBadWeather(originLat, originLng);

    const { price, riderPay } = calculateDeliveryPrice({
      distanceKm: distance,
      durationMin: duration,
      stopsCount,
      date: new Date(),
      isBadWeather: bad,
    });

    console.log("price", price, riderPay);

    res.status(200).json({ price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all deliveries (with pagination)
exports.getDeliveries = async (req, res) => {
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const offset = (page - 1) * limit;
  try {
    const { count, rows } = await Delivery.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ deliveries: rows, total: count, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all deliveries (with pagination)
exports.getMyDeliveries = async (req, res) => {
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const offset = (page - 1) * limit;

  // console.log("first", req.params?.role);
  try {
    if (req.params.role !== "rider") {
      const { count, rows } = await Delivery.findAndCountAll({
        where: {
          userId: req.userId,
        },
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json({ deliveries: rows, total: count, page, limit });
    } else {
      const { count, rows } = await Delivery.findAndCountAll({
        where: {
          riderUserId: req.userId,
        },
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });
      // console.log("req.userId", req.userId, count);

      res.status(200).json({ deliveries: rows, total: count, page, limit });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single delivery by id
exports.getDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery)
      return res.status(404).json({ message: "delivery Not found" });
    res.status(200).json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Accept a delivery (assign rider)
exports.acceptDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, riderId } = req.body;
    const riderUserId = req.userId;
    // const riderUserId = riderId;

    if (!riderUserId) return res.status(404).json({ message: "Auth error" });

    const delivery = await Delivery.findByPk(id);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery Not found" });
    }
    if (delivery.riderUserId) {
      return res
        .status(500)
        .json({ message: "Delivery is no longer available" });
    }
    delivery.status = "accepted";
    delivery.riderUserId = riderUserId;
    delivery.riderLat = latitude;
    delivery.riderLng = longitude;
    delivery.intransitStatus = "toPickup";
    await delivery.save();

    // req.io.emit("delivery:accepted", delivery);
    req.io.to(`delivery_${id}`).emit("deliveryUpdate", delivery);
    // console.log("first", String(id));
    req.io.to(`delivery_${id}`).emit("deliveryAccepted", String(id));
    req.io.emit("deliveryAccepted", String(id));

    res.status(200).json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update delivery status or location
exports.updateDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const delivery = await Delivery.findByPk(id);
    let deliveryStatus = delivery?.status;
    if (!delivery) {
      return res.status(404).json({ message: "delivery Not found" });
    }

    Object.assign(delivery, updates);
    let walletBal = null;
    if (
      req.body?.status === "cancelled" &&
      delivery?.paymentStatus === "paid" &&
      deliveryStatus !== "cancelled"
    ) {
      const user = await User.findByPk(req.userId);

      if (!user) {
        return res.status(404).json({ message: "User Not found" });
      }

      user.walletBal = parseFloat(user.walletBal) + parseFloat(delivery?.price);
      walletBal = user.walletBal;
      await Payment.create({
        amount: delivery?.price,
        userId: req.userId,
        description: "Rereimbursement for cancelled delivery",
        deliveryId: delivery?.id,
        type: "deposit",
        reason: "wallet",
        status: "success",
      });
      await user.save();
    }
    await delivery.save();
    // emit update events
    // if (updates.status)
    //   req.io.emit(`delivery:status:${id}`, { status: updates.status });
    // if (updates.currentLat && updates.currentLng)
    //   req.io.emit(`delivery:location:${id}`, {
    //     currentLat: updates.currentLat,
    //     currentLng: updates.currentLng,
    //   });
    req.io.to(`delivery_${id}`).emit("deliveryUpdate", delivery);

    if (walletBal) {
      res.status(200).json({ delivery, walletBal });
    } else {
      res.status(200).json(delivery);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.confirmDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await Delivery.findByPk(id);
    let deliveryStatus = delivery?.status;
    if (!delivery) {
      return res.status(404).json({ message: "delivery Not found" });
    }

    if (
      req?.body?.status === "completed" &&
      deliveryStatus !== "completed" &&
      req?.body?.otp
    ) {
      if (delivery?.riderUserId !== req.userId) {
        return res.status(401).json({ message: "Authentication Error" });
      }
      if (req?.body?.otp !== delivery?.destinationOtp) {
        return res.status(401).json({ message: "Incorrect OTP" });
      }

      const user = await User.findByPk(req.userId);

      if (!user) {
        return res.status(404).json({ message: "User Not found" });
      }

      user.walletBal =
        parseFloat(user.walletBal) + parseFloat(delivery?.riderPay);
      const walletBal = user.walletBal;
      await Payment.create({
        amount: delivery?.riderPay,
        userId: req.userId,
        description: "Payment for completing delivery",
        deliveryId: delivery?.id,
        type: "deposit",
        reason: "wallet",
        status: "success",
      });

      await user.save();

      delivery.status = "completed";

      await delivery.save();

      req.io.to(`delivery_${id}`).emit("deliveryUpdate", delivery);

      return res.status(200).json({ delivery, walletBal });
    }

    if (req?.body?.otp && req?.body?.intransitStatus === "toStop2") {
      if (req?.body?.otp !== delivery?.stopOtp) {
        return res.status(401).json({ message: "Incorrect OTP" });
      }

      delivery.intransitStatus = req?.body?.intransitStatus;
      await delivery.save();

      req.io.to(`delivery_${id}`).emit("deliveryUpdate", delivery);
      return res.status(200).json(delivery);
    }

    if (req?.body?.otp && req?.body?.intransitStatus === "toDropOff") {
      if (
        req?.body?.otp !== delivery?.stopOtp &&
        req?.body?.otp !== delivery?.stop2Otp
      ) {
        return res.status(401).json({ message: "Incorrect OTP" });
      }

      delivery.intransitStatus = req?.body?.intransitStatus;

      await delivery.save();

      req.io.to(`delivery_${id}`).emit("deliveryUpdate", delivery);
      return res.status(200).json(delivery);
    }

    res.status(200).json({ message: "Success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// rate delivery
exports.rateDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const delivery = await Delivery.findByPk(id);
    if (!delivery) {
      return res.status(404).json({ message: "delivery Not found" });
    }
    const user = await User.findByPk(delivery?.riderUserId);

    const totalRatings = user.rating * user.ratingNo; // sum of all previous ratings
    const updatedNo = user.ratingNo + 1;
    const updatedRating = (totalRatings + Number(rating)) / updatedNo;

    user.rating = updatedRating;
    user.ratingNo = updatedNo;
    delivery.rating = Number(rating);
    if (feedback) {
      delivery.feedback = feedback;
    }

    await user.save();
    await delivery.save();

    res.status(200).json({ message: "success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
