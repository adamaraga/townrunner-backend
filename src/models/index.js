const dbConfig = require("../config/dbConfig.js");

const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

sequelize
  .authenticate()
  .then(() => {
    console.log("connected..");
  })
  .catch((err) => {
    console.log("Errords" + err);
  });

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require("./userModel.js")(sequelize, DataTypes);
db.confirmations = require("./confirmationModel.js")(sequelize, DataTypes);
db.messages = require("./messageModel.js")(sequelize, DataTypes);
db.chats = require("./chatModel.js")(sequelize, DataTypes);
db.calls = require("./callModel.js")(sequelize, DataTypes);
db.deliveries = require("./deliveryModel.js")(sequelize, DataTypes);
db.riders = require("./riderModel.js")(sequelize, DataTypes);
db.payments = require("./paymentModel.js")(sequelize, DataTypes);

db.sequelize.sync({ force: false }).then(() => {
  console.log("yes re-sync done!");
});

// db.users.hasMany(db.confirmations, {
//   foreignKey: "userId",
//   // as: "confirmation",
// });
// db.confirmations.belongsTo(db.users, {
//   foreignKey: "userId",
//   as: "users",
// });

// db.users.hasMany(db.participant, {
//   foreignKey: "userId",
//   as: "user",
//   targetKey: "id",
// });

// db.participant.belongsTo(db.users, {
//   foreignKey: "userId",
//   as: "user",
//   targetKey: "id",
// });

module.exports = db;
