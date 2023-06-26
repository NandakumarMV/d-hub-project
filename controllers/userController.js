const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Product = require("../models/productModels");
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const config = require("../config/config");
const randomstring = require("randomstring");
const Category = require("../models/categoryModel");
const { use } = require("../app");

//bcrypt password

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//otp send

const sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    const user = await User.findOne({ mobile: mobile });
    req.session.userMobile = req.body.mobile;
    if (!user) {
      res.status(401).json({ message: "user not found" });
    } else {
      const client = new twilio(process.env.accountSid, process.env.authToken);

      client.verify.v2
        .services(process.env.verifySid)
        .verifications.create({ to: "+91" + user.mobile, channel: "sms" })
        .then((verification) => {
          if (verification.status === "pending") {
            res.render("users/otp-enter", { layout: "user-layout" });
          } else {
            res.render("users/otp-verify", {
              message: "OTP sending failed",
              layout: "user-layout",
            });
          }
        });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const pageOtp = async (req, res) => {
  try {
    res.render("users/otp-verify", { layout: "user-layout" });
  } catch (error) {}
};
const loadOtpHome = async (req, res) => {
  try {
    const userMobile = "+91" + req.session.userMobile;
    console.log(userMobile);
    const otp = req.body.otp;
    client.verify.v2
      .services(process.env.verifySid)
      .verificationChecks.create({ to: User.mobile, code: otp })
      .then(async (verification_check) => {
        if (verification_check.status === "approved") {
          console.log(verification_check.status);
          let user = await User.findOne({ mobile: req.session.userMobile });

          req.session.user_id = user._id;

          console.log(req.session.user_id);

          res.redirect("/home");
        } else {
          res.render("users/", {
            message: "invalid OTP",
            layout: "user-layout",
          });
        }
      });
  } catch (error) {
    throw new Error(error.message);
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
        ',please click here to <a href="http://localhost:3000/forget-password?token=' + //to config
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
    res.render("users/signup", { layout: "user-layout" });
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
        layout: "user-layout",
        message: "your signup is successful, please verify your email ",
      });
    } else {
      res.render("users/signup", {
        layout: "user-layout",
        message: "your signup is failed",
      });
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
    res.render("users/email-verified", { layout: "user-layout" });
  } catch (error) {
    console.log(error.message);
  }
};

//login methods

const loginLoad = async (req, res) => {
  try {
    res.render("users/signup", { layout: "user-layout" });
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
          res.render("users/signup", {
            layout: "user-layout",
            message: "please verify your email",
          });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/home");
        }
      } else {
        res.render("users/signup", {
          layout: "user-layout",
          message: "invaild sign in id",
        });
      }
    } else {
      res.render("users/signup", {
        layout: "user-layout",
        message: "invaild sign in id",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const products = await Product.find({ unlist: false }).lean();

    const category = await Category.find({ unlist: false }).lean();
    res.render("users/home-page", {
      layout: "user-layout",
      user: userData,
      products: products,
      category: category,
    });
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
    res.render("users/forget", { layout: "user-layout" });
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
        res.render("users/forget", {
          layout: "user-layout",
          message: "Please verify your email",
        });
      } else {
        const randomString = randomstring.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        sendResetPasswordMail(userData.name, userData.email, randomString),
          res.render("users/forget", {
            layout: "user-layout",
            message: "please check your mail to reset your password",
          });
      }
    } else {
      res.render("users/forget", {
        layout: "user-layout",
        message: "User email is incorrect",
      });
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
      res.render("users/forget-password", {
        layout: "user-layout",
        user_id: tokenData._id,
      });
    } else {
      res.render("users/404", {
        layout: "user-layout",
        message: "token is invalid",
      });
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
const loadProductView = async (req, res) => {
  try {
    // console.log("hiiiiiiiiiiiiiiiiiiiiiiiiiiiii");
    const id = req.query.id;
    // console.log(id);
    const product = await Product.findById(id).lean();
    // console.log(product);
    res.render("users/single-product", {
      layout: "user-layout",
      product: product,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//user-profile
const loadUserProfile = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    res.render("users/user-profile", { layout: "user-layout", user: userData });
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
  pageOtp,
  sendOtp,
  loadOtpHome,
  loadProductView,

  loadUserProfile,
};
