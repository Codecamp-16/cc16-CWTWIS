const nodemailer = require("nodemailer");
const nodemailerStub = require("nodemailer-stub");

const transport = nodemailer.createTransport({
  host: "localhost",
  port: 8587,
  tls: {
    rejectUnauthorized: false,
  },
});
module.exports = transport;
