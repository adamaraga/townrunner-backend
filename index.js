require("dotenv").config();
const cors = require("cors");
const { app, server } = require("./src/socket/socket.js");
// require('./src/jobs/subscriptionRenewal.job.js');

const authRoute = require("./src/routes/auth.routes");
const userRoute = require("./src/routes/user.routes");
const countRoute = require("./src/routes/count.routes");
const chatRoute = require("./src/routes/chat.routes");
const callRoute = require("./src/routes/call.routes");
const deliveryRoute = require("./src/routes/delivery.routes");
const paymentRoute = require("./src/routes/payment.routes");
const riderRoute = require("./src/routes/rider.routes");

app.use(cors());

// attach your routes
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/count", countRoute);
app.use("/api/chat", chatRoute);
app.use("/api/call", callRoute);
app.use("/api/delivery", deliveryRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/rider", riderRoute);

app.get("/", (req, res) => {
  res.send("<h1>Hello, Express.js Server!</h1>");
});

// start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
