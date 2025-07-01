module.exports = {
  HOST: "localhost",
  USER: "root",
  PASSWORD: "abdullahi",
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
//   HOST: "localhost",
//   USER: "valleyv1_admin",
//   PASSWORD: "0I&kJ[!ky@-o",
//   DB: "valleyv1_mainDB",
//   dialect: "mysql",

//   pool: {
//     max: 5,
//     min: 0,
//     acquire: 30000,
//     idle: 10000,
//   },
// };
