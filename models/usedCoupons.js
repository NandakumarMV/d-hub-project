const mongoose = require("mongoose");

const usedCouponSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  usedCoupons: [
    {
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
      },
      appliedCoupon: {
        type: Boolean,
        default: false,
      },
      usedCoupon: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

module.exports = mongoose.model("UsedCoupon", usedCouponSchema);
