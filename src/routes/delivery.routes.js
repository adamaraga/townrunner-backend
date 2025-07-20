const deliveryCtrl = require("../controllers/delivery.controller");
const authJwt = require("../middlewares/authJwt");

const router = require("express").Router();
// Create request
router.post("/", [authJwt.verifyToken], deliveryCtrl.createDelivery);
// List requests
router.get("/", [authJwt.verifyToken], deliveryCtrl.getDeliveries);
// My List requests
router.get("/my", [authJwt.verifyToken], deliveryCtrl.getMyDeliveries);
// Get single
router.get("/:id", [authJwt.verifyToken], deliveryCtrl.getDelivery);
// Accept by rider
router.patch("/:id/accept", [authJwt.verifyToken], deliveryCtrl.acceptDelivery);
// Update (status/location)
router.patch("/:id", [authJwt.verifyToken], deliveryCtrl.updateDelivery);

module.exports = router;
