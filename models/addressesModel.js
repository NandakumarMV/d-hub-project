const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const addressSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  addresses: [
    {
      name: {
        type: String,
      },
      mobile: {
        type: Number,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      pincode: {
        type: Number,
      },
      address: {
        type: String,
      },
      is_default: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

const address = mongoose.model("address", addressSchema);

module.exports = address;
