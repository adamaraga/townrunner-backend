const riderCtrl = require("../controllers/rider.controller");
const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Upload fields for rider documents
const riderFields = [
  { name: "idFrontImg", maxCount: 1 },
  { name: "idBackImg", maxCount: 1 },
  { name: "insuranceImg", maxCount: 1 },
  { name: "vehicleImg", maxCount: 1 },
  { name: "roadWorthinessImg", maxCount: 1 },
  { name: "licenseFrontImg", maxCount: 1 },
  { name: "licenseBackImg", maxCount: 1 },
  { name: "selfieWithLicense", maxCount: 1 },
];

// Routes
router.post(
  "/add",
  [authJwt.verifyToken],
  upload.fields(riderFields),
  riderCtrl.createRider
);
router.get("/", [authJwt.verifyToken], riderCtrl.getRiders);
router.get("/one/:userId", [authJwt.verifyToken], riderCtrl.getRider);
router.get("/status", [authJwt.verifyToken], riderCtrl.getRiderStatus);
router.patch(
  "/:id",
  [authJwt.verifyToken],
  upload.fields(riderFields),
  riderCtrl.updateRider
);
router.patch(
  "/update-status/:userId",
  [authJwt.verifyToken, authJwt.isAdmin],
  riderCtrl.updateRiderStatus
);
router.delete("/:id", [authJwt.verifyToken], riderCtrl.deleteRider);

module.exports = router;
