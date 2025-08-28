const db = require("../models");
const Rider = db.riders;
const User = db.users;
const Facial = db.facials;

// Create a new Rider profile
exports.createRider = async (req, res) => {
  try {
    // multer stores files under req.files by fieldname
    const {
      idNumber,
      vehicleBrand,
      plateNumber,
      insuranceExpiry,
      licenseNumber,
      licenseExpiry,
    } = req.body;

    // Map uploaded file paths
    const files = req.files || {};
    const data = {
      idNumber,
      vehicleBrand,
      plateNumber,
      insuranceExpiry,
      licenseNumber,
      licenseExpiry,
      userId: req.userId,
      idFrontImg: files.idFrontImg ? files.idFrontImg[0].path : null,
      idBackImg: files.idBackImg ? files.idBackImg[0].path : null,
      insuranceImg: files.insuranceImg ? files.insuranceImg[0].path : null,
      vehicleImg: files.vehicleImg ? files.vehicleImg[0].path : null,
      roadWorthinessImg: files.roadWorthinessImg
        ? files.roadWorthinessImg[0].path
        : null,
      licenseFrontImg: files.licenseFrontImg
        ? files.licenseFrontImg[0].path
        : null,
      licenseBackImg: files.licenseBackImg
        ? files.licenseBackImg[0].path
        : null,
      selfieWithLicense: files.selfieWithLicense
        ? files.selfieWithLicense[0].path
        : null,
    };

    const rider = await Rider.create(data);
    res.status(201).json(rider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Riders status
exports.updateRiderStatus = async (req, res) => {
  try {
    const rider = await Rider.findByPk({
      where: { userId: req.params.userId },
    });
    if (!rider) return res.status(404).json({ message: "Rider Not found" });

    if (req.body?.status) {
      rider.status = req.body?.status;

      if (req.body?.status === "active") {
        const user = await User.findByPk(req.params.userId);

        user.role = "rider";
        await user.save();
      }

      await rider.save();
    }

    res.status(200).json(rider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all Riders (with pagination)
exports.getRiders = async (req, res) => {
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const offset = (page - 1) * limit;
  try {
    const { count, rows } = await Rider.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ riders: rows, total: count, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single Rider by id
exports.getRider = async (req, res) => {
  try {
    const rider = await Rider.findOne({
      where: {
        userId: req.params.userId,
      },
    });
    const user = await User.findByPk(req.params.userId);
    if (!rider) return res.status(404).json({ message: "Rider Not found" });
    if (!user) return res.status(404).json({ message: "User Not found" });
    res.json({ rider, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Rider status
exports.getRiderStatus = async (req, res) => {
  try {
    const rider = await Rider.findOne({
      where: {
        userId: req.userId,
      },
    });
    const facial = await Facial.findOne({
      where: {
        riderUserId: req.userId,
      },
    });
    // if (!rider) return res.status(404).json({ message: "Rider Not found" });
    console.log("first", {
      docStatus: !rider ? null : rider?.status,
      facial: !facial ? null : "Done",
    });
    res.status(200).json({
      docStatus: !rider ? null : rider?.status,
      facial: !facial ? null : "Done",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Rider profile
exports.updateRider = async (req, res) => {
  try {
    const rider = await Rider.findByPk(req.params.id);
    if (!rider) return res.status(404).json({ message: "Rider Not found" });

    // Merge body fields
    Object.assign(rider, req.body);

    // Handle new uploads
    const files = req.files || {};
    [
      "idFrontImg",
      "idBackImg",
      "insuranceImg",
      "vehicleImg",
      "roadWorthinessImg",
      "licenseFrontImg",
      "licenseBackImg",
      "selfieWithLicense",
    ].forEach((field) => {
      if (files[field]) rider[field] = files[field][0].path;
    });

    await rider.save();
    res.json(rider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Rider profile
exports.deleteRider = async (req, res) => {
  try {
    const rows = await Rider.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ message: "Rider Not found" });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
