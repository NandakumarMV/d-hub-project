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

  /*---------------------------------helper for userside---------------------------------*/

  getCouponDataByCouponCode: (couponCode) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(
          "////////////////////////getCouponDataByCouponCode//////////////////////////",
          couponCode
        );
        const couponData = await coupon.findOne({ couponCode: couponCode });
        console.log(couponData, "coupon data is this");
        if (couponData === null) {
          resolve({ couponNotFound: true });
        } else {
          console.log("resolved coupon data");
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
        console.log("verifyValidCoupon", couponCode);
        const couponData = await coupon.findOne({ couponCode: couponCode });
        if (couponData === null) {
          console.log("coupon data is nulll");
          resolve({
            status: false,
            reasonForRejection: "coupon code dosen't exists",
          });
        } else {
          if (couponData.activeCoupon) {
            console.log("active coupon , coupon data is active");
            const couponExpiryDate = new Date(couponData.createdDate.getTime());
            couponExpiryDate.setDate(
              couponExpiryDate.getDate() + couponData.validFor
            );
            console.log(couponExpiryDate, "coupon expiry data");
            const currentDate = new Date();
            if (couponExpiryDate >= currentDate) {
              console.log("resolved true");
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
        const alreadyCoupon = await UsedCoupon.findOne({ userId: userId });
        console.log(alreadyCoupon, "alreadsjklhfjkdsfk");
        console.log(
          "verify used coupon",
          userId,
          "user id",
          couponId,
          "coupon id"
        );
        const dbQuery = {
          userId: userId,
          usedCoupons: { $elemMatch: { couponId, usedCoupon: true } },
        };
        console.log(dbQuery, "db query is this");
        console.log("after   db query is this...........");
        const alreadyUsedCoupon = await UsedCoupon.findOne({
          userId: userId,
          usedCoupons: { $elemMatch: { couponId, usedCoupon: true } },
        });

        console.log(alreadyUsedCoupon, "already used coupon");

        if (alreadyUsedCoupon === null) {
          console.log("alreadyUsedCoupon  used coupon is resolved");
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
        console.log(
          "apply coupon to cart",
          userId,
          "user id",
          couponId,
          "coupon id"
        );
        const updateResult = await UsedCoupon.updateMany(
          {
            userId: userId,
            usedCoupons: { $elemMatch: { appliedCoupon: true } },
          },
          { $set: { "usedCoupons.$[elem].appliedCoupon": false } },
          { arrayFilters: [{ "elem.appliedCoupon": true }] }
        );
        console.log(updateResult, "updated result is this");
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
          console.log(usedCoupon, "used coupon is this");
          const insertNewCouponHistory = await usedCoupon.save();
          resolve({ status: true });
        } else {
          console.log("coupon exist is true");
          const couponExists = await UsedCoupon.findOne({
            userId: userId,
            usedCoupons: { $elemMatch: { couponId: couponId } },
          });
          console.log("coupon exsts", couponExists);
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
            console.log("apply to cart resolved true");
            resolve({ status: true });
          } else {
            const couponModified = await UsedCoupon.updateOne(
              {
                userId: userId,
                usedCoupons: { $elemMatch: { couponId: couponId } },
              },
              { $set: { "usedCoupons.$.appliedCoupon": true } }
            );
            console.log(couponModified, "coupon modified resolved true");
            resolve({ status: true });
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  checkCouponValidityStatus: (userId, cartValue) => {
    return new Promise(async (resolve, reject) => {
      try {
        const couponApplied = await UsedCoupon.findOne({
          userId: userId,
          usedCoupons: { $elemMatch: { appliedCoupon: true } },
        });
        console.log(couponApplied, "couponApplied is this");
        if (couponApplied === null) {
          console.log("coupon applied true here");
          resolve({ status: false, couponDiscount: 0 });
        } else {
          const activeCoupon = couponApplied.usedCoupons.find(
            (coupon) => coupon.appliedCoupon === true
          );

          const activeCouponId = activeCoupon.couponId.toString();

          const activeCouponData = await coupon.findOne({
            _id: new ObjectId(activeCouponId),
          });

          const minimumOrderValue = parseInt(activeCouponData.minOrderAmount);

          //////////////////if the coupon is already used by the user/////////////

          const previouslyUsedCoupon = await UsedCoupon.findOne({
            userId: userId,
            usedCoupons: {
              $elemMatch: { couponId: activeCoupon.couponId, usedCoupon: true },
            },
          });

          if (activeCouponData.activeCoupon) {
            if (previouslyUsedCoupon === null) {
              if (cartValue >= minimumOrderValue) {
                const couponExpiryDate = new Date(
                  activeCouponData.createdDate.getTime()
                );

                couponExpiryDate.setDate(
                  couponExpiryDate.getDate() +
                    parseInt(activeCouponData.validFor)
                );

                const currentDate = new Date();

                if (couponExpiryDate >= currentDate) {
                  console.log("(couponExpiryDate >= currentDate) ");
                  const discountPercentage = parseInt(
                    activeCouponData.discountPercentage
                  );
                  console.log(discountPercentage, "discount percentage");
                  const discountAmountForCart =
                    cartValue * (discountPercentage / 100);
                  console.log(discountAmountForCart, "discount amt from cart");
                  const maximumCouponDiscountAmount = parseInt(
                    activeCouponData.maxDisAmount
                  );
                  console.log(
                    maximumCouponDiscountAmount,
                    "maximum coupon discount amount"
                  );
                  let eligibleCouponDiscountAmount = 0;

                  if (discountAmountForCart >= maximumCouponDiscountAmount) {
                    console.log(
                      "discountAmountForCart >= maximumCouponDiscountAmount"
                    );
                    eligibleCouponDiscountAmount = maximumCouponDiscountAmount;
                    console.log(
                      eligibleCouponDiscountAmount,
                      "eligibleCouponDiscountAmount"
                    );
                  } else {
                    console.log(
                      "discountAmountForCart >= maximumCouponDiscountAmount else case"
                    );
                    eligibleCouponDiscountAmount = discountAmountForCart;
                    console.log(
                      "eligibleCouponDiscountAmount:",
                      eligibleCouponDiscountAmount
                    );
                  }
                  resolve({
                    status: true,
                    couponId: activeCouponId,
                    couponDiscount: eligibleCouponDiscountAmount,
                  });
                } else {
                  resolve({
                    status: false,
                    couponId: activeCouponId,
                    couponDiscount: 0,
                  });
                }
              } else {
                resolve({
                  status: false,
                  couponId: activeCouponId,
                  couponDiscount: 0,
                });
              }
            } else {
              resolve({
                status: false,
                couponId: activeCouponId,
                couponDiscount: 0,
              });
            }
          } else {
            resolve({
              status: false,
              couponId: activeCouponId,
              couponDiscount: 0,
            });
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  updateCouponUsedStatus: (userId, couponId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const requestedUserId = new ObjectId(userId);
        console.log(requestedUserId, "requested user id");
        const requestedCouponId = new ObjectId(couponId);
        console.log(requestedCouponId, "requested coupon id");
        // Check if coupon Exist or not

        const findAppliedCoupon = await UsedCoupon.findOne({
          userId: requestedUserId,
          usedCoupons: { $elemMatch: { couponId: requestedCouponId } },
        });
        console.log(findAppliedCoupon, "find applied coupon");
        if (findAppliedCoupon) {
          // Coupon exists, update the usedCoupon value to true
          const couponUpdateStatus = await UsedCoupon.updateOne(
            {
              userId: requestedUserId,
              usedCoupons: { $elemMatch: { couponId: requestedCouponId } },
            },
            { $set: { "usedCoupons.$.usedCoupon": true } }
          );
          console.log(couponUpdateStatus, "coupon update status");
          resolve({ status: true }); // Resolve the promise after updating the status
        } else {
          reject(new Error("Coupon not found")); // Reject the promise if coupon does not exist
        }
      } catch (error) {
        console.log("Error from updateCouponUsedStatus couponHelper :", error);

        reject(error);
      }
    });
  },
};
