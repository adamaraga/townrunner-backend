require("dotenv").config();
module.exports = {
  HOST: "localhost",
  USER: "root",
  PASSWORD: "",
  DB: "townrunner",
  dialect: "mysql",

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

// module.exports = {
//   HOST: "ls-3aebd288f46e6973d1354506694ad0f3eacf4e9a.cbacyg8ewfow.eu-central-1.rds.amazonaws.com",
//   USER: process.env.DB_USER,
//   PASSWORD: process.env.DB_PASS,
//   DB: "townrunner",
//   dialect: "mysql",

//   pool: {
//     max: 5,
//     min: 0,
//     acquire: 30000,
//     idle: 10000,
//   },
// };
