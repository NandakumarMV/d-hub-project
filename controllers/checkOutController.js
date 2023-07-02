const Cart = require("../models/cartModel");
const Product = require("../models/productModels");
const Addresses = require("../models/addressesModel");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const moment = require("moment-timezone");

module.exports = {
  submitCheckout: async (req, res) => {
    try {
      console.log("entered checkout page");

      const userId = req.session.user_id;
      console.log(userId, "userid");
      console.log("FIND THE CART DETAILS");

      const cartData = await Cart.findOne({ User_id: userId }).lean();
      console.log(cartData, "cart data has been fetched successfully");

      console.log(req.body, "all req body");
      const paymentMethod = req.body.paymentMethod;

      console.log(paymentMethod, "paymentmethod");
      const status = paymentMethod === "COD" ? "PENDING" : "PAYED";

      console.log(status, "the status of payment");

      const addressData = await Addresses.findOne(
        { user_id: userId, "addresses.is_default": true },
        { "addresses.$": 1 }
      ).lean();
      console.log(addressData, "address data is this");

      if (!addressData) {
        return res.status(400).json({ error: "Default address not found." });
      }
      const subtotal = cartData.products.reduce((acc, product) => {
        return acc + product.total;
      }, 0);
      console.log(subtotal, "subtotal");

      const products = cartData.products.map((product) => ({
        productId: product.productId,
        quantity: product.quantity,
        total: product.total,
      }));
      console.log(products, "products loading");
      const defaultAddress = addressData.addresses[0];
      const address = {
        name: defaultAddress.name,
        mobile: defaultAddress.mobile,
        address: defaultAddress.address,
        city: defaultAddress.city,
        state: defaultAddress.state,
        pincode: defaultAddress.pincode,
      };

      console.log(address, "setting the defaulf address");

      const newOrder = new Order({
        userId: userId,
        date: Date(),
        orderValue: subtotal,
        paymentMethod: paymentMethod,
        orderStatus: status,
        products: products,
        addressDetails: address,
      });
      const savedOrder = await newOrder.save();
      console.log(savedOrder, "saved to data base");
      await Cart.findOneAndDelete({ User_id: userId });
      res.render("users/order-sucessfull", {
        layout: "user-layout",
        savedOrder,
      });
    } catch (error) {
      console.log(error.message);
    }
  },

  loadOrders: async (req, res) => {
    console.log("entered the order loading");
    const userId = req.session.user_id;
    console.log(userId, "this is userid");
    const orderDetails = await Order.find({ userId: userId }).lean();
    console.log(orderDetails, "order details are here");

    const orderHistory = orderDetails.map((history) => {
      let createdOnIST = moment(history.date)
        .tz("Asia/kolkata")
        .format("DD-MM-YYYY h:mm A");

      return { ...history, date: createdOnIST };
    });
    console.log(orderHistory, "order history");
    res.render("users/order-page", {
      layout: "user-layout",
      orderDetails: orderHistory,
    });
  },
};
