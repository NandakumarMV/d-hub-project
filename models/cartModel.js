const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  User_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
  ],
});

const Cart = mongoose.model("CartData", cartSchema);

module.exports = Cart;
