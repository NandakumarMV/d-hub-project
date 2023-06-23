// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// const productSchema = new Schema({
//   brand: {
//     type: String,
//     require: true,
//   },
//   productname: {
//     type: String,
//     require: true,
//   },
//   category: {
//     type: String,
//     require: true,
//   },
//   price: {
//     type: Number,
//     require: true,
//   },
//   inStock: {
//     type: Number,
//     require: true,
//   },
//   images: {
//     type: String,
//     require: true,
//   },
//   description: {
//     type: String,
//     required: true,
//   },
//   deleted: {
//     type: Boolean,
//     default: false,
//   },
// });

// const Product = mongoose.model("Product", productSchema);

// module.exports = Product;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  brand: {
    type: String,
    required: true,
  },
  productname: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  // inStock: {
  //   type: Number,
  //   required: true,
  // },
  images: [{ type: String }],
  description: {
    type: String,
    required: true,
  },
  unlist: {
    type: Boolean,
    default: false,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
