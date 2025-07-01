// const appRoot = require("app-root-path");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const process = require("process");

const transporter = nodemailer.createTransport({
  // host: "valleyviewhotelng.com",
  // port: 465,
  // secure: true, // true for 465, false for other ports
  // priority: "high",
  // auth: {
  //   user: "",
  //   pass: "",
  // },

  service: "gmail", // Update with your email service provider
  auth: {
    // user: "",
    // pass: "",
  },
});

const sendVerificationEmail = async (name, token, to) => {
  const mailData = {
    firstName: name,
    link: "http://localhost:3000/verify-mail/" + token,
  };

  const html = await ejs.renderFile(
    process.cwd() + "/public/templates/emails/emailVerification.ejs",
    mailData
  );

  const mailOptions = {
    from: "adamabdullahiaraga@gmail.com",
    to: to,
    subject: "Email verification",
    html, // Use the rendered HTML from the template
  };

  await new Promise((resolve, reject) => {
    // send mail
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
};

const sendLoginDetailsToStaff = async (name, password, to) => {
  const mailData = {
    firstName: name,
    password,
    email: to,
  };

  const html = await ejs.renderFile(
    process.cwd() + "/public/templates/emails/newStaff.ejs",
    mailData
  );

  const mailOptions = {
    from: "adamabdullahiaraga@gmail.com",
    to: to,
    subject: "Lily Solutions New Staff",
    html, // Use the rendered HTML from the template
  };

  await new Promise((resolve, reject) => {
    // send mail
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
};

const sendForgotPasswordEmail = async (name, token, to) => {
  const mailData = {
    firstName: name,
    link: "http://localhost:3000/reset-password/" + token,
  };

  const html = await ejs.renderFile(
    process.cwd() + "/public/templates/emails/forgotPassword.ejs",
    mailData
  );

  const mailOptions = {
    from: "adamabdullahiaraga@gmail.com",
    to: to,
    subject: "Forget Password",
    html, // Use the rendered HTML from the template
  };

  // await new Promise((resolve, reject) => {
  //   // verify connection configuration
  //   transporter.verify(function (error, success) {
  //     if (error) {
  //       console.log(error);
  //       reject(error);
  //     } else {
  //       console.log("Server is ready to take our messages");
  //       resolve(success);
  //     }
  //   });
  // });

  await new Promise((resolve, reject) => {
    // send mail
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
};

const sendCareerAppEmail = async (firstName, lastName, to) => {
  const mailData = {
    firstName,
    lastName,
  };

  const html = await ejs.renderFile(
    process.cwd() + "/public/templates/emails/careerApplication.ejs",
    mailData
  );

  const mailOptions = {
    from: "adamabdullahiaraga@gmail.com",
    to: to,
    subject: "Thanks for applying to Lily solutions",
    html, // Use the rendered HTML from the template
  };

  await new Promise((resolve, reject) => {
    // send mail
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
};

const sendMail = {
  sendVerificationEmail,
  sendForgotPasswordEmail,
  sendLoginDetailsToStaff,
  sendCareerAppEmail,
};

module.exports = sendMail;
