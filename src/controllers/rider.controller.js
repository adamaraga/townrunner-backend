const db = require("../models");
const Rider = db.riders;

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
    const rider = await Rider.findByPk(req.params.id);
    if (!rider) return res.status(404).json({ message: "Rider Not found" });
    res.json(rider);
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
