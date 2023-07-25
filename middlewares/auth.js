const User = require("../models/userModel");

const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const userData = await User.findById(req.session.user_id);

      if (userData && !userData.blocked) {
        console.log("user not blocked");
        next();
      } else {
        console.log("enter else conditions");
        const dlete = delete req.session.user_id;
        console.log(dlete, "truee ogxhhxjko");
        res.redirect("/login");
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogOut = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      res.redirect("/home");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};
const otpLog = async (req, res, next) => {
  try {
    if (req.session.user._id) {
      res.redirect("/home");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogOut,
  otpLog,
};
