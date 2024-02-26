const Cart = require("../models/cartModel");
const Product = require("../models/productModels");
const Addresses = require("../models/addressesModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const productHepler = require("../helpers/productHelpers");
const moment = require("moment-timezone");
const { ObjectId } = require("mongodb");
const userhelper = require("../helpers/userHelpers");
const couponHelper = require("../helpers/couponHelper");
const userHelpers = require("../helpers/userHelpers");
module.exports = {
  placeOrder: async (req, res) => {
    try {
      let userId = req.session.user_id;
      let orderDetails = req.body;

      let productsOrdered = await productHepler.getProductListForOrders(userId);

      if (productsOrdered) {
        let totalOrderValue = await productHepler.getCartValue(userId);
        /*============coupon discounts=====*/
        const availableCouponData =
          await couponHelper.checkCouponValidityStatus(userId, totalOrderValue);
        let couponDiscountAmount = 0;
        if (availableCouponData.status) {
          const couponDiscountAmount = availableCouponData.couponDiscount;
          orderDetails.couponDiscount = couponDiscountAmount;

          totalOrderValue = totalOrderValue - couponDiscountAmount;
          const updateCouponUsedStatus =
            await couponHelper.updateCouponUsedStatus(
              userId,
              availableCouponData.couponId
            );
        }

        productHepler
          .placingOrder(userId, orderDetails, productsOrdered, totalOrderValue)
          .then(async (orderId) => {

            if (req.body["paymentMethod"] === "COD") {
              res.json({ COD_CHECKOUT: true });
            } else if (req.body["paymentMethod"] === "ONLINE") {
              productHepler
                .generateRazorpayOrder(orderId, totalOrderValue)
                .then(async (razorpayOrderDetails) => {
                 
                  const user = await User.findById({ _id: userId }).lean();
                  res.json({
                    ONLINE_CHECKOUT: true,
                    userDetails: user,
                    userOrderRequestData: orderDetails,
                    orderDetails: razorpayOrderDetails,
                    razorpayKeyId: "rzp_test_bfnSH6XKHJdHG9",
                  });
                });
            } else if (req.body["paymentMethod"] === "WALLET") {
              console.log("wallet true");
              const walletBalance = await userhelper.walletBalance(userId);
              console.log(walletBalance, "wallet balance is this");
              if (walletBalance >= totalOrderValue) {
                productHepler
                  .placingOrder(
                    userId,
                    orderDetails,
                    productsOrdered,
                    totalOrderValue
                  )
                  .then(async (orderId, error) => {
                    res.json({ WALLET_CHECKOUT: true, orderId });
                  });
              } else {
                res.json({ error: "Insufficient balance." });
              }
            } else {
              res.json({ paymentStatus: false });
            }
          });
      } else {
        res.json({ checkoutStatus: false });
      }
    } catch (error) {
      console.log(error.message);
      res.redirect("/user-error");
    }
  },

  verifyPayment: async (req, res) => {
    console.log("verify payment enters here");
    const razorpayPayment = req.body.razorpayPayment;
    console.log(razorpayPayment, "razorpayPaymentttttttttttt");
    const orderDetails = req.body.orderDetails;

    console.log(orderDetails, "orderDetailssssssssssssssss");
    console.log(req.body, "reqqqq");
    productHepler.verifyRazorpayment(req.body).then(() => {
      let paymentId = req.body[" orderDetails[receipt]"];
      let paymentSuccess = true;
      productHepler.changePaymentStatus(paymentId, paymentSuccess).then(() => {
        res.json({ status: true });
      });
    });
  },
  walletOrder: async (req, res) => {
    try {
      console.log("wallet order controller");
      const orderId = req.query.id;
      const userId = req.session.user_id;
      const updatewallet = await userhelper.updatewallet(userId, orderId);
      console.log(updatewallet, "updated wallet data");
      res.redirect("/order-sucessfull");
    } catch (error) {}
  },
  loadOrders: async (req, res) => {
    console.log("entered the order loading");
    const userId = req.session.user_id;
    // console.log(userId, "this is userid");
    const orderDetails = await Order.find({ userId: userId }).lean();
    // console.log(orderDetails, "order details are here");

    const products = await Product.find({});

    const orderHistory = orderDetails.map((history) => {
      let createdOnIST = moment(history.date)
        .tz("Asia/kolkata")
        .format("DD-MM-YYYY h:mm A");

      return { ...history, date: createdOnIST };
    });
    // console.log(orderHistory, "order history");
    res.render("users/order-page", {
      layout: "user-layout",
      orderDetails: orderHistory,
    });
  },

  loadOrdersView: async (req, res) => {
    try {
      const orderId = req.query.id;
      const userId = req.session.user_id;

      const order = await Order.findOne({ _id: orderId }).populate({
        path: "products.productId",
        select: "brand productname price images",
      });

      const createdOnIST = moment(order.date)
        .tz("Asia/Kolkata")
        .format("DD-MM-YYYY h:mm A");
      order.date = createdOnIST;

      // Get the current date in the Asia/Kolkata timezone
      const currentDateIST = moment().tz("Asia/Kolkata");

      // Calculate the difference between the current date and the order date
      const orderDate = moment(order.date, "DD-MM-YYYY h:mm A").tz(
        "Asia/Kolkata"
      );
      const differenceInDays = currentDateIST.diff(orderDate, "days");

      // Check if the order is more than 14 days old
      const isLessThan14DaysOld = differenceInDays < 14;
      console.log(isLessThan14DaysOld, "isMoreThan14DaysOld");
      const orderDetails = order.products.map((product) => {
        const images = product.productId.images;
        const image = images.length > 0 ? images[0] : "";
        return {
          name: product.productId.productname,
          brand: product.productId.brand,
          image: image,
          price: product.productId.price,
          quantity: product.quantity,
          status: order.orderStatus,
        };
      });

      const deliveryAddress = {
        name: order.addressDetails.name,
        address: order.addressDetails.address,
        city: order.addressDetails.city,
        state: order.addressDetails.state,
        pincode: order.addressDetails.pincode,
      };

      const subtotal = order.orderValue;
      const cancellationStatus = order.cancellationStatus;

      res.render("users/view-order", {
        layout: "user-layout",
        orderDetails: orderDetails,
        deliveryAddress: deliveryAddress,
        subtotal: subtotal,
        orderId: orderId,
        orderDate: createdOnIST,
        cancellationStatus: cancellationStatus,
        isLessThan14DaysOld: isLessThan14DaysOld,
      });
    } catch (error) {
      console.log(error.message);
      res.redirect("/user-error");
    }
  },

  placedOrder: async (req, res) => {
    try {
      res.render("users/order-sucessfull", { layout: "user-layout" });
    } catch (error) {
      console.log(error.message);
    }
  },
  cancellOrder: async (req, res) => {
    try {
      console.log("cancell ordering");
      const orderId = req.body.orderId;
      const url = "/ordersView?id=" + orderId;
      console.log(orderId, "order have reached");
      const updateOrder = await Order.findByIdAndUpdate(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            orderStatus: "PENDING",
            cancellationStatus: "cancellation requested",
          },
        },
        { new: true }
      ).exec();
      console.log(updateOrder, "updated order");

      res.redirect(url);
    } catch (error) {
      console.log(error.message);
      res.redirect("/user-error");
    }
  },

  returnOrder: async (req, res) => {
    try {
      console.log("return ordering");
      const orderId = req.body.orderId;
      const url = "/ordersView?id=" + orderId;
      console.log(orderId, "order have reached");
      const updateOrder = await Order.findByIdAndUpdate(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            orderStatus: "Return Processing",
            cancellationStatus: "Return Processing",
          },
        },
        { new: true }
      ).exec();
      console.log(updateOrder, "updated order");

      res.redirect(url);
    } catch (error) {
      console.log(error.message);
      res.redirect("/user-error");
    }
  },

  loadWallet: async (req, res) => {
    try {
      const userId = req.session.user_id;
      console.log(userId);
      const walletDetails = await userHelpers.getWalletDetails(userId);
      const creditOrderDetails = await userHelpers.creditOrderDetails(userId);
      const debitOrderDetails = await userHelpers.debitOrderDetails(userId);
      console.log(
        walletDetails + "walletDetails",
        creditOrderDetails + "creditOrderDetails",
        debitOrderDetails + "debitOrderDetails"
      );
      const isLogin = req.session.user_id ? true : false;

      // Merge credit and debit order details into a single array
      const orderDetails = [...creditOrderDetails, ...debitOrderDetails];

      // Sort the merged order details by date and time in descending order
      orderDetails.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Pagination logic
      const currentPage = parseInt(req.query.page) || 1;
      const PAGE_SIZE = 5;

      const totalItems = orderDetails.length;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);

      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedOrderDetails = orderDetails.slice(startIndex, endIndex);

      const hasPrev = currentPage > 1;
      const hasNext = currentPage < totalPages;

      const pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push({
          number: i,
          current: i === currentPage,
        });
      }
      console.log(
        walletDetails + "wallet details",
        paginatedOrderDetails + "paginated order",
        hasPrev,
        hasNext,
        pages
      );

      res.render("users/wallet", {
        layout: "user-layout",
        walletDetails,
        orderDetails: paginatedOrderDetails,
        showPagination: totalItems > PAGE_SIZE,
        hasPrev,
        prevPage: currentPage - 1,
        hasNext,
        nextPage: currentPage + 1,
        pages,
        isLogin: isLogin,
      });
    } catch (error) {
      console.log(error.message);
      res.redirect("/user-error");
    }
  },
};
