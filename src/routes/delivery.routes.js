const deliveryCtrl = require("../controllers/delivery.controller");
const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();
// Create request
router.post("/", [authJwt.verifyToken], deliveryCtrl.createDelivery);
// Create request Schedule
router.post("/schedule", [authJwt.verifyToken], deliveryCtrl.scheduleDelivery);
// price requests
router.post("/price", [authJwt.verifyToken], deliveryCtrl.getDeliveryPrice);
// List requests
router.get("/", [authJwt.verifyToken], deliveryCtrl.getDeliveries);
// My List requests
router.get("/my/:role", [authJwt.verifyToken], deliveryCtrl.getMyDeliveries);
// Get single
router.get("/:id", [authJwt.verifyToken], deliveryCtrl.getDelivery);
// Accept by rider
router.patch("/accept/:id", [authJwt.verifyToken], deliveryCtrl.acceptDelivery);
// router.patch("/accept/:id", deliveryCtrl.acceptDelivery);
// Update (status/location)
router.patch("/:id", [authJwt.verifyToken], deliveryCtrl.updateDelivery);
// confirm
router.patch(
  "/confirm/:id",
  [authJwt.verifyToken],
  deliveryCtrl.confirmDelivery
);
// rate
router.patch("/rate/:id", [authJwt.verifyToken], deliveryCtrl.rateDelivery);

module.exports = router;
