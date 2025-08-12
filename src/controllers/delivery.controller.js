const db = require("../models");
const Delivery = db.deliveries;
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
  try {
    if (req.userId) {
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
          riderUserId: req.query.riderUserId,
        },
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });
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
    // const riderUserId = req.userId;
    const riderUserId = riderId;

    const delivery = await Delivery.findByPk(id);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery Not found" });
    }
    if (delivery.status === "accepted") {
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
    req.io.to(`delivery_${id}`).emit("deliveryAccepted");

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
    if (!delivery) {
      return res.status(404).json({ message: "delivery Not found" });
    }

    Object.assign(delivery, updates);
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

    res.status(200).json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
