const express = require("express");
const cors = require("cors");
const authRoute = require("./src/routes/auth.routes");
const userRoute = require("./src/routes/user.routes");
const countRoute = require("./src/routes/count.routes");
const messageRoute = require("./src/routes/message.routes");
const chatRoute = require("./src/routes/chat.routes");
const dotenv = require("dotenv");
const { app, server } = require("./src/socket/socket.js");

// const app = express();
app.use(cors());

// middleware
dotenv.config();

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

app.use(express.static(__dirname + "/public"));
app.use("/uploads", express.static("uploads"));

// routes
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/count", countRoute);
app.use("/api/message", messageRoute);
app.use("/api/chat", chatRoute);

//port
const PORT = process.env.PORT || 5000;

//server
server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
