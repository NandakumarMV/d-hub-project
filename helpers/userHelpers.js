const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Address = require("../models/addressesModel");
const Product = require("../models/productModels");
const Wallet = require("../models/walletModel");
const moment = require("moment-timezone");

const walletModel = require("../models/walletModel");

module.exports = {
  walletBalance: (userId) => {
    console.log("wallet balance");
    return new Promise(async (resolve, reject) => {
      try {
        const walletBalance = await walletModel.findOne({ userId });
        console.log(walletBalance, "wallet balance");

        if (walletBalance === null) {
          resolve(0);
        } else {
          const walletAmount = walletBalance.walletAmount;
          resolve(walletAmount);
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  updatewallet: (userId, orderId) => {
    console.log("reached helper for wallet");
    return new Promise(async (resolve, reject) => {
      try {
        const orderdetails = await Order.findOne({ _id: orderId });
        console.log(orderdetails, "orderdetails");
        const wallet = await walletModel.findOne({ userId: userId });
        console.log(wallet, "wallet is this");
        if (wallet) {
          const updatedWalletAmount =
            wallet.walletAmount - orderdetails.orderValue;
          const updatedWallet = await walletModel.findOneAndUpdate(
            { userId: userId },
            { $set: { walletAmount: updatedWalletAmount } }
          );
          console.log(updatedWalletAmount, "updatedWalletAmount");

          resolve(updatedWalletAmount);
        } else {
          reject("wallet not find");
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  updateProductStock: async (orderedProducts) => {
    try {
      console.log("reached updatedproductstock");
      for (const orderedProduct of orderedProducts) {
        const productId = orderedProduct.productId;
        const quantity = orderedProduct.quantity;

        // Find the product by its ID
        const product = await Product.findById(productId);

        // Update the product stock by subtracting the ordered quantity
        product.inStock -= quantity;

        // Save the updated product
        await product.save();
      }
    } catch (error) {}
  },

  getWalletDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const walletDetails = await Wallet.findOne({ userId: userId }).lean();
        // console.log(walletDetails,'walletDetailsvvvvvvvvvvvvvv');

        resolve(walletDetails);
      } catch (error) {
        reject(error);
      }
    });
  },

  creditOrderDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const orderDetails = await Order.find({
          userId: userId,
          $or: [{ paymentMethod: "ONLINE" }, { paymentMethod: "WALLET" }],
          $or: [{ orderStatus: "cancelled" }, { orderStatus: "Returned" }],
        }).lean();
        console.log(orderDetails, "order details credit");
        const orderHistory = orderDetails.map((history) => {
          let createdOnIST = moment(history.date)
            .tz("Asia/Kolkata")
            .format("DD-MM-YYYY h:mm A");

          return { ...history, date: createdOnIST };
        });

        resolve(orderHistory);
      } catch (error) {
        reject(error);
      }
    });
  },

  debitOrderDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const orderDetails = await Order.find({
          userId: userId,
          paymentMethod: "WALLET",
          $or: [
            { orderStatus: "Placed" },
            { orderStatus: "PENDING" },
            { orderStatus: "Delivered" },
            { orderStatus: "Shipped" },
          ],
        }).lean();
        console.log(orderDetails, "debit order details");

        const orderHistory = orderDetails.map((history) => {
          let createdOnIST = moment(history.date)
            .tz("Asia/Kolkata")
            .format("DD-MM-YYYY h:mm A");

          return { ...history, date: createdOnIST };
        });

        resolve(orderHistory);
      } catch (error) {
        reject(error);
      }
    });
  },
};
