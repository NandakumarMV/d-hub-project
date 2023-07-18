const Cart = require("../models/cartModel");
const Product = require("../models/productModels");
const Addresses = require("../models/addressesModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const productHepler = require("../helpers/productHelpers");
const moment = require("moment-timezone");
const { ObjectId } = require("mongodb");
const userhelper = require("../helpers/userHelpers");
const couponHelper = require("../helpers/couponHelper");

const manageCoupon = async (req, res) => {
  try {
    const admin = req.session.user_id;
    const adminData = await User.findById(admin);
    // console.log(adminData, "admin data is here");

    const activeCoupons = await couponHelper.getActiveCoupons();
    const inActiveCoupons = await couponHelper.getInActiveCoupons();
    const passingCouponData = {
      layout: "admin-layout",
      adminData,
      activeCoupons,
      inActiveCoupons,
    };
    res.render("admin/manage-coupon", passingCouponData);
  } catch (error) {
    console.log(error.message);
  }
};
const addCoupon = async (req, res) => {
  console.log("enteres get controller for coupons");
  try {
    const admin = req.session.user_id;
    const adminData = await User.findById(admin);

    let couponExistError = false;

    if (req.session.couponExistError) {
      couponExistError = req.session.couponExistError;
    }

    res.render("admin/coupon-add", {
      layout: "admin-layout",
      adminData,
      couponExistError,
    });

    delete req.session.couponExistError;
  } catch (error) {
    console.log("Error from addCoupon couponController :", error.message);
  }
};
const addCouponPost = async (req, res) => {
  console.log("enters post controllers for  coupon");
  try {
    const admin = req.session.user_id;
    const adminData = await User.findById(admin);

    const couponData = req.body;
    const couponId = couponData.couponId;
    const couponExist = await couponHelper.couponVerify(couponData);
    console.log(couponExist, "coupon exists ");
    if (couponExist.status) {
      console.log("entered status findingggg");
      const couponAdding = await couponHelper.addNewcoupon(couponData);
      console.log(couponAdding, "coupon adding is here");
      res.redirect("/admin/coupon-add");
    } else if (couponExist.duplicateCoupon) {
      req.session.couponExistError = "Coupon code already exist";
      res.redirect("/admin/coupon-add");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const editingCouponPage = async (req, res) => {
  try {
    const admin = req.session.user_id;
    const adminData = await User.findById(admin);
    let existCoupon = false;
    if (req.session.existCoupon) {
      existCoupon = req.session.existCoupon;
    }
    const couponId = req.query.id;
    const couponData = await couponHelper.getSingleCoupon(couponId);
    const passingData = {
      layout: "admin-layout",
      adminData,
      existCoupon,
      couponData,
    };
    res.render("admin/coupon-edit", passingData);
    delete req.session.existCoupon;
  } catch (error) {
    console.log(error.message);
  }
};
const editedCoupon = async (req, res) => {
  try {
    const admin = req.session.user_id;
    const adminData = await User.findById(admin);

    const couponData = req.body;
    console.log(couponData, "coupon data reached here");
    const couponId = couponData.couponId;

    const existCoupon = await couponHelper.couponVerify(couponData);
    if (existCoupon.status) {
      const couponUpdated = await couponHelper.updateCouponData(
        couponData,
        couponId
      );
      res.redirect("/admin/manage-coupon");
    } else if (existCoupon.duplicateCoupon) {
      // req.session.existCoupon = "coupon already exists";
      res.redirect("/admin/edit-coupon/?id=" + couponId);
    }
  } catch (error) {
    console.log(error.message);
  }
};

const changeCouponStatus = async (req, res) => {
  try {
    console.log("changeCouponStatus  have reached");
    const admin = req.session.user_id;
    const adminData = await User.findById(admin);
    const couponId = req.body.couponId;
    const couponData = await couponHelper.getSingleCoupon(couponId);
    if (couponData.activeCoupon) {
      console.log("entered couponData.activeCoupon");
      const couponUpdated = await couponHelper.couponStatusChange(
        couponData,
        "Deactivate"
      );
      res.redirect("/admin/manage-coupon");
    } else if (!couponData.activeCoupon) {
      const couponUpdated = await couponHelper.couponStatusChange(
        couponData,
        "Activate"
      );
      res.redirect("/admin/inactive-coupons");
    } else {
      console.log("error from change coupon status", error.message);
    }
  } catch (error) {}
};

const inactiveCoupons = async (req, res) => {
  try {
    console.log("reached in activecoupon");
    const admin = req.body.user_id;
    const adminData = await User.findById(admin);
    const inActiveCoupons = await couponHelper.getInActiveCoupons();
    console.log(inActiveCoupons, "inActiveCoupons");
    const dataToRender = {
      layout: "admin-layout",
      adminData,
      inActiveCoupons,
    };
    res.render("admin/deactivated-coupon", dataToRender);
  } catch (error) {
    console.log(error.message);
  }
};

/*---------------------user coupon controller---------------------*/

const applyCouponUser = async (req, res) => {
  console.log("apply coupon user entered");
  try {
    const userId = req.session.user_id;
    const couponCode = req.body.couponCode.toLowerCase();
    console.log(couponCode, "couponcode");
    const couponData = await couponHelper.getCouponDataByCouponCode(couponCode);
    console.log(couponData, "coupon data reached");
    const validCoupon = await couponHelper.verifyValidCoupon(couponCode);
    console.log(validCoupon, "status of valid coupon");
    if (validCoupon.status) {
      const cartValue = await productHepler.getCartValue(userId);
      console.log(cartValue, "cart value is this");
      if (cartValue >= couponData.minOrderAmount) {
        const EligibleUser = await couponHelper.verifyUsedCoupon(
          userId,
          couponData._id
        );
        console.log(EligibleUser, "eligible user");
        if (EligibleUser.status) {
          const applyNewCoupon = await couponHelper.applyCouponToCart(
            userId,
            couponData._id
          );
          console.log(applyNewCoupon, "apply new coupon");
          if (applyNewCoupon.status) {
            req.session.couponApplied = "congrats, coupon applied sucessfully";
            res.redirect("/checkout");
          } else {
            req.session.couponInvalidError = "sorry,Unexpected Error occured";
            res.redirect("/checkout");
          }
        } else {
          req.session.couponInvalidError = "coupon already used";
          res.redirect("/checkout");
        }
      } else {
        req.session.couponInvalidError =
          "coupon not applied,purchase minimum for " +
          couponData.minOrderAmount +
          "to get coupon";
        res.redirect("/checkout");
      }
    } else if (validCoupon.reasonForRejection) {
      req.session.couponInvalidError = validCoupon.reasonForRejection;
      res.redirect("/checkout");
    }
  } catch (error) {}
};
module.exports = {
  manageCoupon,
  addCoupon,
  addCouponPost,
  editingCouponPage,
  editedCoupon,
  changeCouponStatus,
  inactiveCoupons,
  applyCouponUser,
};
