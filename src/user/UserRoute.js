const express = require("express");
const { check, validationResult } = require("express-validator");
const User = require("./User");
const bcrypt = require("bcrypt");
const transport = require("../email/EmailService");

const router = express.Router();

router.post(
  "/register",
  check("username")
    .notEmpty()
    .withMessage("username_null")
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage("username_size"),
  check("email")
    .notEmpty()
    .withMessage("email_null")
    .isEmail()
    .withMessage("email_not_valid"),
  check("password").notEmpty().withMessage("Password cannot be null"),
  async (req, res) => {
    const errors = validationResult(req);
    // console.log(errors.isEmpty());
    if (!errors.isEmpty()) {
      let validationError = {};
      errors.array().forEach((e) => {
        console.log("E", e);
        validationError[e.path] = req.t(e.msg);
      });
      return res.status(400).send({ validationError });
    }
    // req.t => t = translation
    const { password, email, username } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ password: hashedPassword, email, username });
    await transport.sendMail({
      from: "My App <me@mail.com>",
      to: email,
      subject: "account activation",
      html: `Token is ${"random"}`,
    });
    return res.status(200).send({ message: req.t("user_created_success") });
  }
);
module.exports = router;
