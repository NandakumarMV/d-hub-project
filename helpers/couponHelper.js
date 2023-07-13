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
const coupon = require("../models/couponModel");
const { log } = require("handlebars/runtime");
const UsedCoupon = require("../models/usedCoupons");
const usedCoupons = require("../models/usedCoupons");

module.exports = {
  getActiveCoupons: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const activeCoupon = await coupon.find({ activeCoupon: true }).lean();
        resolve(activeCoupon);
      } catch (error) {
        console.log("error from coupons:", error);
        reject(error);
      }
    });
  },
  getInActiveCoupons: () => {
    console.log("getInActiveCoupons");
    return new Promise(async (resolve, reject) => {
      try {
        const InActiveCoupon = await coupon
          .find({ activeCoupon: false })
          .lean();
        console.log(InActiveCoupon, "InActiveCoupon");
        resolve(InActiveCoupon);
      } catch (error) {
        console.log("error from coupons:", error);
        reject(error);
      }
    });
  },

  couponVerify: (newCouponData) => {
    return new Promise(async (resolve, reject) => {
      const couponCodeforVerification = newCouponData.couponCode.toLowerCase();
      try {
        const couponExist = await coupon
          .find({ couponCode: couponCodeforVerification })
          .lean();
        console.log(couponExist, "coupon exist checking");
        if (couponExist.length === 0) {
          console.log("status is true");
          resolve({ status: true });
        } else {
          resolve({ duplicateCoupon: true });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  addNewcoupon: (newCouponData) => {
    console.log("enteres coupon helper");
    return new Promise(async (resolve, reject) => {
      try {
        console.log(newCouponData, "newCouponDataaaaaa");
        const couponCode = newCouponData.couponCode.toLowerCase();
        const useCount = 0;
        const createdDate = new Date();
        const activeCoupon =
          newCouponData.activeCoupon === "true" ? true : false;
        const couponDetails = newCouponData.couponDetails;
        const discountPercentage = newCouponData.discountPercentage;
        const maxDisAmount = newCouponData.maxDisAmount;
        const minOrderAmount = newCouponData.minOrderAmount;
        const validFor = newCouponData.validFor;

        const couponData = new coupon({
          couponCode: couponCode,
          couponDetails: couponDetails,
          discountPercentage: discountPercentage,
          maxDisAmount: maxDisAmount,
          minOrderAmount: minOrderAmount,
          validFor: validFor,
          activeCoupon: activeCoupon,
          useCount: useCount,
          createdDate: createdDate,
        });
        console.log(couponData, "couponData reached here");
        const addCoupon = await couponData.save();
        resolve(addCoupon);
      } catch (error) {
        reject(error);
      }
    });
  },

  getSingleCoupon: (couponId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const couponData = await coupon
          .findOne({ _id: new ObjectId(couponId) })
          .lean();
        resolve(couponData);
      } catch (error) {
        reject(error);
      }
    });
  },

  updateCouponData: (couponData, couponId) => {
    console.log("enter updating coupon helpers");
    return new Promise(async (resolve, reject) => {
      try {
        const couponCode = couponData.couponCode.toLowerCase();
        console.log(couponCode, "couponCode");
        const activeCoupon = couponData.activeCoupon === "true" ? true : false;
        console.log(activeCoupon, "activeCoupon");
        const couponDetails = couponData.couponDetails;
        console.log(couponDetails, "couponDetails");
        const discountPercentage = couponData.discountPercentage;
        console.log(discountPercentage, "discountPercentage");
        const maxDisAmount = couponData.maxDisAmount;
        console.log(maxDisAmount, "maxDisAmount");
        const minOrderAmount = couponData.minOrderAmount;
        console.log(minOrderAmount, "minOrderAmount");
        const validFor = couponData.validFor;
        console.log(validFor, "validFor");
        const updateCoupon = await coupon.updateOne(
          { _id: couponId },
          {
            $set: {
              couponCode: couponCode,
              couponDetails: couponDetails,
              discountPercentage: discountPercentage,
              maxDisAmount: maxDisAmount,
              minOrderAmount: minOrderAmount,
              validFor: validFor,
              activeCoupon: activeCoupon,
            },
          }
        );
        console.log(updateCoupon, "updating coupon data");
        resolve(updateCoupon);
      } catch (error) {
        reject(error);
      }
    });
  },
  couponStatusChange: (couponData, modifyStatus) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (modifyStatus === "Activate") {
          couponData.activeCoupon = true;
        } else if (modifyStatus === "deactivate") {
          couponData.activeCoupon = false;
        }
        const couponStatus = await coupon.updateOne(
          { _id: new ObjectId(couponData._id) },
          { $set: couponData }
        );
        resolve(couponStatus);
      } catch (error) {
        reject(error);
      }
    });
  },

  /*------helper for userside------*/

  getCouponDataByCouponCode: (couponCode) => {
    return new Promise(async (resolve, reject) => {
      try {
        const couponData = await coupon.findOne({ couponCode: couponCode });
        if (couponData === null) {
          resolve({ couponNotFound: true });
        } else {
          resolve(couponData);
        }
      } catch (error) {
        console.log(error.message);
      }
    });
  },

  verifyValidCoupon: (couponCode) => {
    return new Promise(async (resolve, reject) => {
      try {
        const couponData = await coupon.findOne({ couponCode: couponCode });
        if (couponData === null) {
          resolve({
            status: false,
            reasonForRejection: "coupon code dosen't exists",
          });
        } else {
          if (couponData.activeCoupon) {
            const couponExpiryDate = new Date(couponData.createdDate.getTime());
            couponExpiryDate.setDate(
              couponExpiryDate.getDate() + couponData.validFor
            );
            const currentDate = new Date();
            if (couponExpiryDate >= currentDate) {
              resolve({ status: true });
            } else {
              resolve({
                status: false,
                reasonForRejection: "coupon code expired",
              });
            }
          } else {
            resolve({
              status: false,
              reasonForRejection: "coupon currently un-available",
            });
          }
        }
      } catch (error) {
        console.log(error.message);
        reject(error);
      }
    });
  },
  verifyUsedCoupon: (userId, couponId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const dbQuery = {
          userId: userId,
          usedCoupons: { $eleMatch: { couponId, usedCoupon: true } },
        };
        const alreadyUsedCoupon = await UsedCoupon.findOne({
          userId: userId,
          usedCoupons: { $eleMatch: { couponId, usedCoupon: true } },
        });
        if (alreadyUsedCoupon === null) {
          resolve({ status: true });
        } else {
          resolve({ status: false });
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  applyCouponToCart: (userId, couponId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const updateResult = await UsedCoupon.updateMany(
          {
            userId: userId,
            usedCoupons: { $eleMatch: { appliedCoupon: true } },
          },
          { $set: { "usedCoupons.$[elem].appliedCoupon": false } },
          { arrayFilters: [{ "elem.appliedCoupon": true }] }
        );
        const userCouponHistory = await UsedCoupon.findOne({ userId: userId });
        if (userCouponHistory === null) {
          const usedCoupon = new UsedCoupon({
            userId: userId,
            usedCoupons: [
              {
                couponId: couponId,
                appliedCoupon: true,
                usedCoupon: false,
              },
            ],
          });
          const insertNewCouponHistory = await usedCoupon.save();
          resolve({ status: true });
        } else {
          const couponExists = await UsedCoupon.findOne({
            userId: userId,
            usedCoupons: { $eleMatch: { couponId: couponId } },
          });
          if (couponExists === null) {
            const couponObjectExist = await UsedCoupon.updateOne(
              { userId: userId },
              {
                $push: {
                  usedCoupons: {
                    couponId: couponId,
                    appliedCoupon: true,
                    UsedCoupon: false,
                  },
                },
              }
            );
            resolve({ status: true });
          } else {
            const couponModified = await UsedCoupon.updateOne(
              {
                userId: userId,
                usedCoupons: { $eleMatch: { couponId: couponId } },
              },
              { $set: { "usedCoupons.$.appliedCoupon": true } }
            );
            resolve({ status: true });
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  },
};
