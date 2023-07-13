const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
  },
  couponDetails: {
    type: String,
    required: false,
  },
  discountPercentage: {
    type: Number,
    required: true,
  },
  maxDisAmount: {
    type: Number,
    required: true,
  },
  minOrderAmount: {
    type: Number,
    required: true,
  },
  validFor: {
    type: Number,
    required: true,
  },
  activeCoupon: {
    type: Boolean,
    default: false,
  },
  useCount: {
    type: Number,
  },
  createdDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Coupon", couponSchema);
