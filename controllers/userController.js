const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const config = require("../config/config");
const randomstring = require("randomstring");

//bcrypt password

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
//for sending mail
const sendVerifyMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOption = {
      from: config.emailUser,
      to: email,
      subject: "to verfiy mail",
      html:
        "<p> hi" +
        name +
        ',please click here to <a href="http://localhost:3000/verify?id=' +
        user_id +
        '">verify</a>ypur mail.</p>',
    };
    transporter.sendMail(mailOption, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("email has been sent:-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};
// for reset password send mail
const sendResetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOption = {
      from: config.emailUser,
      to: email,
      subject: "to Reset Password",
      html:
        "<p> hi" +
        name +
        ',please click here to <a href="http://localhost:3000/forget-password?token=' +
        token +
        '">reset </a>your password</p>',
    };
    transporter.sendMail(mailOption, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("email has been sent:-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};
//loading sign up page
const loadSignUp = async (req, res) => {
  try {
    res.render("users/signup", { layout: "layouts/user-layout" });
  } catch (error) {
    console.log(error.message);
  }
};

//data to database

const insertUser = async (req, res) => {
  try {
    const securePass = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: securePass,
      is_admin: 0,
    });
    const userDate = await user.save();

    if (userDate) {
      sendVerifyMail(req.body.name, req.body.email, userDate._id);
      res.render("users/signup", {
        message: "your signup is successful, please verify your email ",
      });
    } else {
      res.render("users/signup", { message: "your signup is failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verfiyMail = async (req, res) => {
  try {
    const updateInfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_verified: 1 } }
    );
    console.log(updateInfo);
    res.render("users/email-verified");
  } catch (error) {
    console.log(error.message);
  }
};

//login methods

const loginLoad = async (req, res) => {
  try {
    res.render("users/signup");
  } catch (error) {
    console.log(error.message);
  }
};
const verfiyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passMatch = await bcrypt.compare(password, userData.password);

      if (passMatch) {
        if (userData.is_verified === 0) {
          res.render("users/signup", { message: "please verify your email" });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/home");
        }
      } else {
        res.render("users/signup", { message: "invaild sign in id" });
      }
    } else {
      res.render("users/signup", { message: "invaild sign in id" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    res.render("users/home-page", { user: userData });
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};
const forgetLoad = async (req, res) => {
  try {
    res.render("users/forget");
  } catch (error) {
    console.log(error.message);
  }
};
const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_verified === 0) {
        res.render("users/forget", { message: "Please verify your email" });
      } else {
        const randomString = randomstring.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        sendResetPasswordMail(userData.name, userData.email, randomString),
          res.render("users/forget", {
            message: "please check your mail to reset your password",
          });
      }
    } else {
      res.render("users/forget", { message: "User email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const forgetpasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;

    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("users/forget-password", { user_id: tokenData._id });
    } else {
      res.render("users/404", { message: "token is invalid" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const sec_password = await securePassword(password);
    const updatedData = await User.findByIdAndUpdate(user_id, {
      $set: { password: sec_password, token: "" },
    });
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = {
  loadSignUp,
  insertUser,
  verfiyMail,
  loginLoad,
  verfiyLogin,
  loadHome,
  userLogout,
  forgetLoad,
  forgetVerify,
  forgetpasswordLoad,
  resetPassword,
};
