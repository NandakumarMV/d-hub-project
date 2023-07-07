const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Product = require("../models/productModels");
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const config = require("../config/config");
const randomstring = require("randomstring");
const Category = require("../models/categoryModel");
const { use } = require("../app");
const { default: mongoose } = require("mongoose");
const Addresses = require("../models/addressesModel");

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

// const insertUser = async (req, res) => {
//   try {
//     const securePass = await securePassword(req.body.password);
//     const user = new User({
//       name: req.body.name,
//       email: req.body.email,
//       mobile: req.body.mobile,
//       password: securePass,
//       is_admin: 0,
//     });
//     const userDate = await user.save();

//     if (userDate) {
//       sendVerifyMail(req.body.name, req.body.email, userDate._id);
//       res.render("users/signup", {
//         layout: "user-layout",
//         message: "your signup is successful, please verify your email ",
//       });
//     } else {
//       res.render("users/signup", {
//         layout: "user-layout",
//         message: "your signup is failed",
//       });
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };
const insertUser = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Check if email or mobile already exists in the database
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.render("users/signup", {
        layout: "user-layout",
        message: "Email or mobile number already exists",
      });
    }

    const securePass = await securePassword(password);
    const user = new User({
      name,
      email,
      mobile,
      password: securePass,
      is_admin: 0,
    });
    const savedUser = await user.save();

    if (savedUser) {
      sendVerifyMail(name, email, savedUser._id);
      return res.render("users/signup", {
        layout: "user-layout",
        message: "Your signup is successful, please verify your email",
      });
    } else {
      return res.render("users/signup", {
        layout: "user-layout",
        message: "Your signup has failed",
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
    const userId = new mongoose.Types.ObjectId(req.session.user_id);
    console.log(userId, "user id.....");
    const userData = await User.findOne({ _id: userId }).lean();
    const defaultAddress = await Addresses.findOne(
      { user_id: userId, "addresses.is_default": true },
      { "addresses.$": 1 }
    ).lean();
    console.log(defaultAddress, "defaultAddress of user");
    if (defaultAddress) {
      res.render("users/user-profile", {
        layout: "user-layout",
        userData,
        defaultAddress: defaultAddress.addresses,
      });
    } else {
      res.render("users/user-profile", { layout: "user-layout", userData });
    }
  } catch (error) {
    console.log(error.message);
  }
};
// const addressList = async (req, res) => {};

const editUser = async (req, res) => {
  const id = new mongoose.Types.ObjectId(req.session.user_id);
  const userDate = await User.findById(id).lean();
  console.log(userDate, "userdata......");
  if (!userDate) {
    throw new Error("user data not find");
  }
  let updatedUser = {
    image: req.file.filename,
    name: req.body.name,
    email: req.body.email,
    mobile: req.body.mobile,
  };
  console.log(updatedUser, "updated user");
  if (req.file) {
    updatedUser.image = req.file.filename;
  }
  const updatedUserData = await User.findByIdAndUpdate(
    { _id: id },
    { $set: updatedUser },
    { new: true }
  );
  res.redirect("/user-profile");
};
const loadAddress = async (req, res) => {
  try {
    // console.log("address loadingggggggggggggg");
    const userId = req.session.user_id;
    // console.log(userId, "kkkkkkkkkkkkkkkkkkkkk");
    const userAddress = await Addresses.findOne({ user_id: userId })
      .lean()
      .exec();
    console.log(userAddress, "userAddressss");
    if (userAddress) {
      if (userAddress.addresses.length === 1) {
        userAddress.addresses[0].is_default = true;
      }

      const addressDetails = userAddress.addresses.map((address) => {
        return {
          name: address.name,
          mobile: address.mobile,
          address: address.address,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          _id: address._id,
          is_default: address.is_default,
        };
      });

      // console.log(addressDetails, "addressdetails");
      res.render("users/address", { layout: "user-layout", addressDetails });
    } else {
      res.render("users/address", {
        layout: "user-layout",
        addressDetails: [],
      });
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

const addressList = async (req, res) => {
  try {
    // console.log(
    //   "entered this page............................................"
    // );
    const userId = req.session.user_id;

    const name = req.body.name;
    const mobile = req.body.mobile;
    const city = req.body.city;
    const state = req.body.state;
    const pincode = req.body.pincode;
    const address = req.body.address;
    console.log(name);

    console.log(city);
    console.log(state);
    console.log(pincode);
    const newAddress = {
      name: name,
      mobile: mobile,
      address: address,
      city: city,
      state: state,
      pincode: pincode,
      is_default: false,
    };

    let userAddress = await Addresses.findOne({ user_id: userId });
    // console.log(userAddress, "useraddresssssss");
    if (!userAddress) {
      newAddress.is_default = true;
      userAddress = new Addresses({ user_id: userId, addresses: [newAddress] });
    } else {
      userAddress.addresses.push(newAddress);
      if (userAddress.addresses.length === 1) {
        userAddress.addresses[0].is_default = true;
      }
    }

    await userAddress.save();
    console.log(userAddress, "useraddress");

    res.redirect("/address");
  } catch (error) {
    throw new Error(error.message);
  }
};

const deletingAddress = async (req, res) => {
  try {
    const id = req.query.id;
    const userId = req.session.user_id;

    const address = await Addresses.findOne({ user_id: userId });

    const deletedAddress = address.addresses.find(
      (addr) => addr._id.toString() === id
    );
    console.log(deletedAddress, "deletedAddress");
    const isDefaultAddress = deletedAddress && deletedAddress.is_default;
    console.log(isDefaultAddress, "isDefaultAddress");

    address.addresses = address.addresses.filter(
      (addr) => addr._id.toString() !== id
    );

    if (isDefaultAddress && address.addresses.length > 0) {
      const newDefaultAddress = address.addresses.find(
        (addr) => addr._id.toString() !== id
      );
      if (newDefaultAddress) {
        newDefaultAddress.is_default = true;
      }
      console.log(newDefaultAddress, "newDefaultAddress");
    }

    // Save the updated address
    await address.save();
    res.redirect("/address");
  } catch (error) {
    throw new Error(error.message);
  }
};
const editAddress = async (req, res) => {
  try {
    console.log("edit address entering");
    const userId = req.session.user_id;
    const id = req.body._id;
    console.log(id, "kkkkkkkkkkkkkkkkkkkkkkk");
    const name = req.body.name;
    const mobile = req.body.mobile;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const pincode = req.body.pincode;

    const updatedAddress = await Addresses.findOneAndUpdate(
      { user_id: userId, "addresses._id": id },
      {
        $set: {
          "addresses.$.name": name,
          "addresses.$.mobile": mobile,
          "addresses.$.address": address,
          "addresses.$.city": city,
          "addresses.$.state": state,
          "addresses.$.pincode": pincode,
        },
      },
      { new: true }
    );
    console.log(updatedAddress, "updatedAddresssssss");
    if (updatedAddress) {
      console.log("Address updated successfully:", updatedAddress);
      res.redirect("/address");
    } else {
      console.log("Address not found or not updated");
      res.redirect("/address");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const settingAsDefault = async (req, res) => {
  try {
    const addressId = req.body.addressId;
    const userId = req.session.user_id;
    console.log(addressId, "addressIdkkkk");
    // Find the current default address and unset its "isDefault" flag
    const old = await Addresses.findOneAndUpdate(
      { user_id: userId, "addresses.is_default": true },
      { $set: { "addresses.$.is_default": false } }
    );
    console.log(old, "oldddddddddd");
    // Set the selected addresses as the new default addresses
    const defaultAddress = await Addresses.findOneAndUpdate(
      { user_id: userId, "addresses._id": addressId },
      { $set: { "addresses.$.is_default": true } }
    );
    console.log(defaultAddress, "uuuuuuuuuuuuuuuuuuuuu");
    const response = {
      setDefault: true,
    };

    res.json({ status: true });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to set addresses as default" });
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
  editUser,
  addressList,
  loadAddress,
  deletingAddress,
  editAddress,
  settingAsDefault,
};
