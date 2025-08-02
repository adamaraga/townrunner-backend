// src/socket/socket.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const geolib = require("geolib");
const User = require("../models").users;
const Delivery = require("../models").deliveries;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware: parse JSON/urlencoded and serve static
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(express.static(__dirname + "/public"));
app.use("/uploads", express.static("uploads"));

// Attach io to req for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// In-memory map of on-duty riders: userId -> { socketId, coords }
const onDutyRiders = new Map();

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.access_token;
    if (!token) return next(new Error("Authentication invalid: No token"));
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findByPk(payload.id);
    if (!user) return next(new Error("Authentication invalid: User not found"));
    socket.user = { id: payload.id, role: user.role };
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication invalid"));
  }
});

function updateNearbyriders() {
  io.sockets.sockets.forEach((socket) => {
    if (socket.user?.role === "user") {
      const customerCoords = socket.user.coords;
      if (customerCoords) sendNearbyRiders(socket, customerCoords);
    }
  });
}

// Helper: send nearby riders to a customer socket
async function sendNearbyRiders(socket, location, deliveryData = null) {
  const list = Array.from(onDutyRiders.values())
    .map((r) => ({ ...r, distance: geolib.getDistance(r.coords, location) }))
    .filter((r) => r.distance <= 10000)
    .sort((a, b) => a.distance - b.distance);
  //for Rider within 10KM
  socket.emit("nearbyRiders", list);
  if (deliveryData) {
    list.forEach((r) => io.to(r.socketId).emit("deliveryOffer", deliveryData));
  }
  return list;
}

// Main connection handler
io.on("connection", (socket) => {
  const { id: userId, role } = socket.user;
  console.log(`User connected: ${userId} (${role})`);

  if (role === "rider") {
    socket.on("goOnDuty", (coords) => {
      onDutyRiders.set(userId, { socketId: socket.id, coords });
      socket.join("onDuty");
      console.log(`Rider ${userId} on duty`);
      // Optionally broadcast updated list
      // io.to("onDuty").emit("nearbyRiders", Array.from(onDutyRiders.values()));
      updateNearbyriders();
    });

    socket.on("goOffDuty", () => {
      onDutyRiders.delete(userId);
      socket.leave("onDuty");
      console.log(`Rider ${userId} off duty`);
      updateNearbyriders();
    });

    socket.on("updateLocation", (coords) => {
      if (onDutyRiders.has(userId)) {
        onDutyRiders.get(userId).coords = coords;
        console.log(`Rider ${userId} location updated`);
        updateNearbyriders();
        socket
          .to(`rider_${userId}`)
          .emit("riderLocationUpdate", { riderId: userId, coords });
      }
    });
  }

  if (role === "user") {
    socket.on("subscribeToZone", (customerCoords) => {
      socket.user.coords = customerCoords;
      sendNearbyRiders(socket, customerCoords);
    });

    socket.on("searchrider", async (deliveryId) => {
      try {
        const delivery = await Delivery.findByPk(deliveryId);
        if (!delivery)
          return socket.emit("error", { message: "Delivery not found" });

        let retries = 0;
        let accepted = false;
        const MAX_RETRIES = 1;
        const interval = setInterval(async () => {
          // console.log("retries", retries);
          if (accepted || retries >= MAX_RETRIES) {
            clearInterval(interval);
            if (!accepted)
              socket.emit("error", { message: "No riders found." });
            return;
          }
          retries++;
          await sendNearbyRiders(
            socket,
            {
              latitude: delivery.originLat,
              longitude: delivery.originLng,
            },
            delivery
          );
        }, 10000);

        socket.on("deliveryAccepted", () => {
          accepted = true;
          clearInterval(interval);
        });

        socket.on("cancelDelivery", async () => {
          clearInterval(interval);
          await Delivery.update(
            { status: "cancelled" },
            { where: { id: deliveryId } }
          );
          socket.emit("deliveryCanceled", { message: "Delivery canceled" });
        });
      } catch (err) {
        console.error("searchrider error", err.message);
        socket.emit("error", { message: "Error searching for delivery" });
      }
    });
  }

  socket.on("subscribeToRiderLocation", (riderId) => {
    const rider = onDutyRiders.get(riderId);

    if (rider) socket.join(`rider_${riderId}`);
    socket.emit("riderLocationUpdate", { riderId, coords: rider.coords });
  });

  socket.on("subscribeDelivery", async (deliveryId) => {
    socket.join(`delivery_${deliveryId}`);
    try {
      const delivery = await Delivery.findByPk(deliveryId);
      socket.emit("deliveryData", delivery);
    } catch (err) {
      socket.emit("error", { message: "Failed to fetch delivery data" });
    }
  });

  socket.on("disconnect", () => {
    if (role === "rider") onDutyRiders.delete(userId);
    console.log(`User disconnected: ${userId} (${role})`);
  });

  socket.on("joinChat", (chatId) => {
    socket.join(`chat_${chatId}`);
  });
  // listen for client send
  socket.on("chatMessage", async ({ chatId, text }) => {
    try {
      const message = await db.messages.create({
        chatId,
        senderId: socket.user.id,
        text,
      });
      io.to(`chat_${chatId}`).emit("newMessage", message);
    } catch (err) {
      socket.emit("error", { message: "Message not sent" });
    }
  });

  socket.join(userId);

  // Handle call signaling
  socket.on("joinCall", (channelName) => {
    socket.join(channelName);
  });
  socket.on("leaveCall", (channelName) => {
    socket.leave(channelName);
  });
});

module.exports = {
  app,
  server,
  getReceiverSocketId: (id) => onDutyRiders.get(id)?.socketId,
};
