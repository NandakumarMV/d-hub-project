const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const walletSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  walletAmount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Wallet", walletSchema);
