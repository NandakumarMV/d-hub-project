const { Reject } = require("twilio/lib/twiml/VoiceResponse");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Address = require("../models/addressesModel");
const razorpay = require("razorpay");
const { resolve } = require("path");
const { ObjectId } = require("mongodb");
const instance = new razorpay({
  key_id: "rzp_test_bfnSH6XKHJdHG9",
  key_secret: "yvWKgSxIUiBsV3jBPL6BCOUi",
});

module.exports = {
  updateSerialNumbers: (products) => {
    return products.map((product, index) => ({
      ...product,
      serialNumber: index + 1,
    }));
  },
  updateCategorySerialNumbers: (categories) => {
    return categories.map((category, index) => ({
      ...category,
      serialNumber: index + 1,
    }));
  },
  getProductListForOrders: async (userId) => {
    return new Promise(async (resovle, reject) => {
      const productDetails = await Cart.findOne({ User_id: userId });

      const subtotal = productDetails.products.reduce((acc, product) => {
        return acc + product.total;
      }, 0);

      const products = productDetails.products.map((product) => ({
        productId: product.productId,
        quantity: product.quantity,
        total: product.total,
      }));
      if (products) {
        resovle(products);
      } else {
        resovle(false);
      }
    });
  },

  getCartValue: (userId) => {
    return new Promise(async (resovle, reject) => {
      const productDetails = await Cart.findOne({ User_id: userId });

      const subtotal = productDetails.products.reduce((acc, products) => {
        return acc + products.total;
      }, 0);

      if (subtotal) {
        resovle(subtotal);
      } else {
        resovle(false);
      }
    });
  },

  placingOrder: async (userId, orderData, orderedProducts, totalOrderValue) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("enter  the helper placing order");
        console.log(userId, "user id is this");
        console.log(orderData, "order details have reached here");
        console.log(orderedProducts, "productsOrdered reached here");
        console.log(totalOrderValue, "totalOrderValue reached here");
        let orderStatus =
          orderData["paymentMethod"] === "COD" ? "Placed" : "PENDING";
        console.log(orderStatus, "this is the order status");
        const defaultAddress = await Address.findOne(
          { user_id: userId, "addresses.is_default": true },
          { "addresses.$": 1 }
        ).lean();
        console.log(defaultAddress, "defaultadress of the user is here");

        if (!defaultAddress) {
          console.log("default address not found");
          return res.redirect("/address");
        }
        const defaultAddressDetails = defaultAddress.addresses[0];
        const address = {
          name: defaultAddressDetails.name,
          mobile: defaultAddressDetails.mobile,
          address: defaultAddressDetails.address,
          city: defaultAddressDetails.city,
          state: defaultAddressDetails.state,
          pincode: defaultAddressDetails.pincode,
        };
        console.log(address, "address of the order placing");
        const orderDetails = new Order({
          userId: userId,
          date: Date(),
          orderValue: totalOrderValue,
          paymentMethod: orderData["paymentMethod"],
          orderStatus: orderStatus,
          products: orderedProducts,
          addressDetails: address,
        });
        console.log(
          orderDetails,
          "this is the order details of the user from helper"
        );
        const placedOrder = await orderDetails.save();
        console.log(placedOrder, "save to the database");
        await Cart.deleteMany({ User_id: userId });
        console.log("placing db order id here jdslkcjdsjk");
        let dbOrderId = placedOrder._id.toString();
        console.log(dbOrderId, "order id of the user");
        console.log("exited from the helper");
        resolve(dbOrderId);
      } catch (error) {
        reject(error);
      }
    });
  },

  generateRazorpayOrder: (orderId, totalOrderValue) => {
    console.log("to generator razorpay order");
    orderValue = totalOrderValue * 100;
    return new Promise((resolve, reject) => {
      try {
        let orderDetails = {
          amount: orderValue,
          currency: "INR",
          receipt: orderId,
        };
        console.log(orderDetails, "orderdetailssssssssssssssssssssssssssss");
        instance.orders.create(orderDetails, function (err, orderDetails) {
          if (err) {
            console.log("Order Creation Error from Razorpay: " + err);
            reject(err);
          } else {
            resolve(orderDetails);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  verifyRazorpayment: (paymentData) => {
    console.log("verify payment entered");
    console.log("payment data:", paymentData);
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let razorpaySecretKey = "yvWKgSxIUiBsV3jBPL6BCOUi";
      let hmac = crypto.createHmac("sha256", razorpaySecretKey); // Hashing Razorpay secret key using SHA-256 Algorithm

      hmac.update(
        paymentData["razorpayPayment[razorpay_order_id]"] +
          "|" +
          paymentData["razorpayPayment[razorpay_payment_id]"]
      );
      let serverGeneratedSignature = hmac.digest("hex");
      console.log(serverGeneratedSignature, "serverGeneratedSignature");
      let razorpayServerGeneratedSignatureFromClient =
        paymentData["razorpayPayment[razorpay_signature]"];
      console.log(
        razorpayServerGeneratedSignatureFromClient,
        "razorpayServerGeneratedSignatureFromClient"
      );

      if (
        serverGeneratedSignature === razorpayServerGeneratedSignatureFromClient
      ) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePaymentStatus: (paymentId, paymentStatus) => {
    console.log("entered change payment status");
    return new Promise(async (resolve, reject) => {
      if (paymentStatus) {
        const orderUpdate = await Order.findByIdAndUpdate(
          { _id: new ObjectId(paymentId) },
          { $set: { orderStatus: "Placed" } }
        ).then(() => {
          resolve();
        });
      } else {
        const orderUpdate = await Order.findByIdAndUpdate(
          { _id: new ObjectId(paymentId) },
          { $set: { orderStatus: "Placed" } }
        ).then(() => {
          resolve();
        });
      }
    });
  },
};
