const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const { userLogout } = require("./userController");

const loadAdminLogin = async (req, res) => {
  try {
    res.render("admin/login");
  } catch (error) {
    console.log(error.message);
  }
};

const verfiyLogin = async (req, res) => {
  try {
    console.log(req.body);
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    console.log(userData);
    if (userData) {
      const passMatch = await bcrypt.compare(password, userData.password);
      console.log(passMatch);
      if (passMatch) {
        if (userData.is_admin === 0) {
          res.render("admin/login");
        } else {
          req.session.user_id = userData._id;
          console.log(req.session.user_id);
          res.redirect("home");
        }
      }
    } else {
      res.render("admin/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const loadDash = async (req, res) => {
  try {
    User.findById({ _id: req.session.user_id });

    res.render("admin/home");
  } catch (error) {
    console.log(error.message);
  }
};
const adminlogout = async (req, res) => {
  try {
    // console.log("hy......................................................");
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};
const tableData = async (req, res) => {
  try {
    res.render("admin/table");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadAdminLogin,
  verfiyLogin,
  loadDash,
  adminlogout,
  tableData,
};
