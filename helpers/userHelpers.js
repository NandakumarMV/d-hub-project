const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Address = require("../models/addressesModel");
const wallet = require("../models/walletModel");
const walletModel = require("../models/walletModel");

module.exports = {
  walletBalance: (userId) => {
    console.log("wallet balancee controller");
    return new Promise(async (resolve, reject) => {
      try {
        const walletBalance = await wallet.findOne({ userId });
        const walletAmount = walletBalance.walletAmount;
        resolve(walletAmount);
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
};
