const User = require("../models/userModel");
const Product = require("../models/productModels");
const bcrypt = require("bcrypt");
const { userLogout } = require("./userController");
const multer = require("multer");
const Category = require("../models/categoryModel");
const { log } = require("handlebars/runtime");
const randomString = require("randomstring");
const mongoose = require("mongoose");
const twilio = require("twilio");
const Verify = require("twilio/lib/rest/Verify");
const productHelpers = require("../helpers/productHelpers");
const helpers = require("handlebars-helpers");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const moment = require("moment-timezone");
const { ObjectId } = require("mongodb");
const Wallet = require("../models/walletModel");
const adminHelpers = require("../helpers/adminHelper");

// const upload = multer({ dest: "./public/uploads/" });

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadAdminLogin = async (req, res) => {
  try {
    res.render("admin/login", { layout: "admin-layout" });
  } catch (error) {
    console.log(error.message);
  }
};

const verfiyLogin = async (req, res) => {
  try {
    console.log(req.body);
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });

    if (userData) {
      const passMatch = await bcrypt.compare(password, userData.password);

      if (passMatch) {
        if (userData.is_admin === 0) {
          res.render("admin/login", { layout: "admin-layout" });
        } else {
          req.session.adminId = userData._id;
          req.session.is_admin = userData.is_admin;

          res.redirect("/admin/home");
        }
      }
    } else {
      res.render("admin/login", { layout: "admin-layout" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const loadDash = async (req, res) => {
  try {
    const admin = await User.find({ is_admin: 1 }).lean();
    const dashBoardDetails = await adminHelpers.loadingDashboard();
    const orderDetails = await adminHelpers.OrdersList(req, res);
    const totalUser = dashBoardDetails.totaluser;
    const totalSales = dashBoardDetails.totalSales;
    const salesbymonth = dashBoardDetails.salesbymonth;
    const paymentMethod = dashBoardDetails.paymentMethod;
    const yearSales = dashBoardDetails.yearSales;
    const todaySales = dashBoardDetails.todaySales;
    let sales = encodeURIComponent(JSON.stringify(salesbymonth));
    res.render("admin/home", {
      layout: "admin-layout",
      totalUser,
      todaySales: todaySales[0],
      totalSales: totalSales[0],
      salesbymonth: encodeURIComponent(JSON.stringify(salesbymonth)),
      paymentMethod: encodeURIComponent(JSON.stringify(paymentMethod)),
      yearSales: yearSales[0],
      orderDetails: orderDetails,
      admin: admin,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const adminlogout = async (req, res) => {
  try {
    delete req.session.is_admin;
    delete req.session.adminId;
    res.redirect("/admin/login");
  } catch (error) {
    console.log(error.message);
  }
};

const loadProducts = async (req, res) => {
  try {
    const updateProducts = await Product.find().lean();

    // console.log(updateProducts);
    const productWithSerialNumber = updateProducts.map((products, index) => ({
      ...products,
      serialNumber: index + 1,
    }));
    console.log(productWithSerialNumber);
    const categories = await Category.find().lean();
    res.render("admin/add-products", {
      layout: "admin-layout",
      products: productWithSerialNumber,
      categories: categories,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const insertProducts = async (req, res) => {
  try {
    var arrayImage = [];
    for (let i = 0; i < req.files.length; i++) {
      arrayImage[i] = req.files[i].filename;
    }

    const newProduct = new Product({
      brand: req.body.brand,
      productname: req.body.productname,

      category: req.body.category,
      price: parseFloat(req.body.price),
      inStock: req.body.stock,
      images: arrayImage,
      description: req.body.description,
    });

    const addProductData = await newProduct.save();
    console.log(addProductData);
    if (addProductData) {
      await Category.updateOne(
        {
          category: req.body.category,
        },
        {
          $push: { products: newProduct._id },
        }
      );
      const updateProducts = await Product.find().lean();
      const productWithSerialNumber =
        productHelpers.updateSerialNumbers(updateProducts);
      const categories = await Category.find().lean();
      res.render("admin/add-products", {
        layout: "admin-layout",
        products: productWithSerialNumber,
        categories: categories,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const loadCategory = async (req, res) => {
  try {
    const updatedcategory = await Category.find({ unlist: false }).lean();
    const categoryWithSerialNumber =
      productHelpers.updateCategorySerialNumbers(updatedcategory);
    res.render("admin/category", {
      layout: "admin-layout",
      category: categoryWithSerialNumber,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const addCategory = async (req, res) => {
  try {
    const category = req.body.category.toUpperCase();

    const existingCategory = await Category.findOne({
      category: { $regex: new RegExp("^" + category + "$", "i") },
    });
    if (existingCategory) {
      const errorMessage = "category already exits";
      const updatedcategory = await Category.find().lean();
      const categoryWithSerialNumber =
        productHelpers.updateSerialNumbers(updatedcategory);

      return res.render("admin/category", {
        layout: "admin-layout",
        category: categoryWithSerialNumber,
        error: errorMessage,
      });
    }
    const newCategory = new Category({
      category: category,
    });
    const categories = await newCategory.save();
    return res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};

const unlistCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryData = await Category.findByIdAndUpdate(
      { _id: id },
      { $set: { unlist: true } }
    );
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};
const listCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryData = await Category.findByIdAndUpdate(
      { _id: id },
      { $set: { unlist: false } }
    );
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};
//user section
const addUsers = async (req, res) => {
  const userData = await User.find({ is_admin: 0, blocked: false }).lean();

  const usersWithSerialNumber = userData.map((users, index) => ({
    ...users,
    serialNumber: index + 1,
  }));
  res.render("admin/users", {
    layout: "admin-layout",
    user: usersWithSerialNumber,
  });
};

const editUser = async (req, res) => {
  try {
    const id = req.query.id;
    // console.log(id);
    const userData = await User.findById({ _id: id }).lean();
    // console.log(userData);
    if (userData) {
      // res.redirect("/admin/home");
      res.render("admin/edit-user", {
        layout: "admin-layout",
        user: userData,
      });
    } else {
      res.redirect("/admin/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const updateUser = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
          is_verified: req.body.verified,
        },
      }
    );

    res.redirect("/admin/home");
  } catch (error) {
    console.log(error.message);
  }
};

const blockUser = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(req.params, "blocked user id ");
    const userData = await User.findByIdAndUpdate(
      { _id: id },
      { $set: { blocked: true } }
    );
    console.log(userData, "seting blocked data as true");
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
  }
};
const addBlockedUsers = async (req, res) => {
  try {
    const userData = await User.find({ blocked: true }).lean();
    const usersWithSerialNumber = userData.map((blockUser, index) => ({
      ...blockUser,
      serialNumber: index + 1,
    }));
    res.render("admin/blocked-users", {
      layout: "admin-layout",
      user: usersWithSerialNumber,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const unblockUser = async (req, res) => {
  try {
    const id = req.query.id;
    // console.log(id, "id");
    const userData = await User.findByIdAndUpdate(
      { _id: id },
      { $set: { blocked: false } }
    );
    res.redirect("/admin/blocked-users");
  } catch (error) {
    console.log(error.message);
  }
};

const editProductsView = async (req, res) => {
  try {
    const id = req.query.id;

    const categories = await Category.find({ unlist: false }).lean();
    const categoryData = {};
    categories.forEach((data) => {
      categoryData[data._id.toString()] = {
        _id: data._id.toString(),
        category: data.category,
      };
    });
    console.log(categoryData, "category data");
    const categoryLookup = [];
    categories.forEach((category) => {
      categoryLookup[category._id.toString()] = category.category;
    });

    const updatedProduct = await Product.findById(id).lean();
    // console.log(lookupCategory(updatedProduct.category), "lookupCategory");

    if (updatedProduct) {
      const productWithCategoryName = {
        ...updatedProduct,
        category: updatedProduct.category,
      };

      res.render("admin/edit-product", {
        product: productWithCategoryName,
        layout: "admin-layout",
        categories: categoryData,
      });
    } else {
      console.log("Product not found");
      res.redirect("/admin/products");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

const editProducts = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findById(id).lean();

    let updatedProductData = {
      brand: req.body.brand,
      productname: req.body.productname,
      inStock: req.body.stock,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      images: product.images,
    };
    console.log(updatedProductData, "updated productsssssss");

    if (req.files && req.files.length > 0) {
      updatedProductData.images = req.files.map((file) => file.filename);
    }

    const product1 = await Product.findByIdAndUpdate(
      id,
      { $set: updatedProductData },
      { new: true }
    );

    res.redirect("/admin/products");
  } catch (error) {
    throw new Error(error.message);
  }
};
const unlistProducts = async (req, res) => {
  try {
    const id = req.query.id;
    const ProductData = await Product.findByIdAndUpdate(
      { _id: id },
      { $set: { unlist: true } }
    );
    res.redirect("/admin/add-products");
  } catch (error) {
    console.log(error.message);
  }
};
const listProducts = async (req, res) => {
  try {
    const id = req.query.id;
    const ProductData = await Product.findByIdAndUpdate(
      { _id: id },
      { $set: { unlist: false } }
    );
    res.redirect("/admin/add-products");
  } catch (error) {
    console.log(error.message);
  }
};

// order management.............
const loadOrders = async (req, res) => {
  try {
    const orderData = await Order.find().populate("userId").lean();
    console.log(orderData, "order data coming");
    const orderHistory = orderData.map((history) => {
      let createdOnIST = moment(history.date)
        .tz("Asia/Kolkata")
        .format("DD-MM-YYYY h:mm A");

      return { ...history, date: createdOnIST, userName: history.userId.name };
    });
    console.log(orderHistory, "order serial numbers");
    res.render("admin/order-details", {
      layout: "admin-layout",
      orderData: orderHistory,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrderView = async (req, res) => {
  try {
    console.log("entered load order views");
    const orderId = req.query.id;
    const order = await Order.findOne({ _id: orderId }).populate({
      path: "products.productId",
      select: "brand price productname images",
    });
    const createdOnIST = moment(order.date)
      .tz("Asia/Kolkata")
      .format("DD-MM-YYYY h:mm A");
    order.date = createdOnIST;

    const orderdetails = order.products.map((product) => {
      const images = product.productId.images || [];
      const image = images.length > 0 ? images[0] : "";
      return {
        brand: product.productId.brand,
        image: image,
        productname: product.productId.productname,
        price: product.productId.price,
        quantity: product.quantity,
        status: order.orderStatus,
      };
    });
    console.log(orderdetails, "order details reached here");
    const deliveryAddress = {
      name: order.addressDetails.name,
      address: order.addressDetails.address,
      city: order.addressDetails.city,
      state: order.addressDetails.state,
      pincode: order.addressDetails.pincode,
    };
    const subtotal = order.orderValue;
    console.log(subtotal, "subtotal");
    const cancellationStatus = order.cancellationStatus;
    res.render("admin/view-order", {
      layout: "admin-layout",
      orderDetails: orderdetails,
      deliveryAddress: deliveryAddress,
      subtotal: subtotal,
      orderId: orderId,
      orderDate: createdOnIST,
      cancellationStatus: cancellationStatus,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const cancellingOrder = async (req, res) => {
  const orderId = req.body.orderId;
  const url = "/admin/ordersView?id=" + orderId;
  const updateOrder = await Order.findByIdAndUpdate(
    { _id: new ObjectId(orderId) },
    {
      $set: {
        orderStatus: "cancelled",
        cancellationStatus: "cancelled",
        cancelledOrder: true,
      },
    },
    { new: true }
  ).exec();

  if (
    (updateOrder.paymentMethod === "ONLINE" ||
      updateOrder.paymentMethod === "WALLET") &&
    updateOrder.orderValue > 0
  ) {
    const wallet = await Wallet.findOne({ userId: updateOrder.userId }).exec();

    if (wallet) {
      const updatedWallet = await Wallet.findOneAndUpdate(
        { userId: updateOrder.userId },
        { $inc: { walletAmount: updateOrder.orderValue } },
        { new: true }
      ).exec();
    } else {
      const newWallet = new Wallet({
        userId: updateOrder.userId,
        walletAmount: updateOrder.orderValue,
      });
      const createdWallet = await newWallet.save();
      console.log(createdWallet, "created wallet");
    }
  }
  // Retrieve the products in the order
  const productsInOrder = updateOrder.products;

  // Iterate over the products and add them back to the stock
  for (const product of productsInOrder) {
    const productId = product.productId;
    const quantity = product.quantity;

    await Product.findByIdAndUpdate(productId, { $inc: { inStock: quantity } });
  }

  res.redirect(url);
};
const rejectingCancell = async (req, res) => {
  const orderId = req.body.orderId;
  const url = "/admin/ordersView?id=" + orderId;
  const updatedOrder = await Order.findByIdAndUpdate(
    { _id: new ObjectId(orderId) },
    {
      $set: {
        orderStatus: "Placed",
        cancellationStatus: "Not requested",
      },
    }
  ).exec();
  res.redirect(url);
};
const shippingOrder = async (req, res) => {
  try {
    console.log("entered shipping order");
    const orderId = req.body.orderId;
    const url = "/admin/ordersView?id=" + orderId;
    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { orderStatus: "Shipped", cancellationStatus: "Shipped" } },
      { new: true }
    ).exec();
    console.log(updatedOrder, "updated order id this");
    res.redirect(url);
  } catch (error) {
    console.log(error.message);
  }
};
const deliveredOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const url = "/admin/ordersView?id=" + orderId;
    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { orderStatus: "Delivered", cancellationStatus: "Delivered" } },
      { new: true }
    ).exec();

    res.redirect(url);
  } catch (error) {
    console.log(error.message);
  }
};
const returnOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const url = "/admin/ordersView?id=" + orderId;
    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          orderStatus: "Returned",
          cancellationStatus: "Returned",
          returnOrder: true,
        },
      },
      { new: true }
    ).exec();

    const wallet = await Wallet.findOne({ userId: updatedOrder.userId }).exec();

    if (wallet) {
      const updatedWallet = await Wallet.findOneAndUpdate(
        { userId: updatedOrder.userId },
        { $inc: { walletAmount: updatedOrder.orderValue } },
        { new: true }
      ).exec();
    } else {
      const newWallet = new Wallet({
        userId: updatedOrder.userId,
        walletAmount: updatedOrder.orderValue,
      });
      const createdWallet = await newWallet.save();
      console.log(createdWallet, "created wallet");
    }

    const productsInOrder = updatedOrder.products;

    // Iterate over the products and add them back to the stock
    for (const product of productsInOrder) {
      const productId = product.productId;
      const quantity = product.quantity;

      await Product.findByIdAndUpdate(productId, {
        $inc: { inStock: quantity },
      });
    }

    res.redirect(url);
  } catch (error) {
    console.log(error.message);
  }
};

const loadSalesPage = async (req, res) => {
  try {
    const adminUser = await User.findOne({ is_admin: 1 }).lean();
    const orderDetails = await adminHelpers.orderDetails();

    res.render("admin/sales-page", {
      layout: "admin-layout",
      order: orderDetails.orderHistory,
      total: orderDetails.total,
      admin: adminUser,
    });
  } catch (error) {}
};
const loadDailySalesPage = async (req, res) => {
  console.log("load daily sale page");
  const dailySales = await adminHelpers.salesDaily();
  console.log(dailySales, "daily sales");
  const adminUser = await User.findOne({ is_admin: 1 }).lean();

  res.render("admin/sales-page", {
    layout: "admin-layout",
    order: dailySales.orderHistory,
    total: dailySales.total,
    admin: adminUser,
  });
};
const loadWeeklySales = async (req, res) => {
  try {
    console.log("loadWeeklySales");
    const WeeklySales = await adminHelpers.WeeklySales();
    const adminUser = await User.findOne({ is_admin: 1 }).lean();
    console.log(WeeklySales, "week sales");
    res.render("admin/sales-page", {
      layout: "admin-layout",
      order: WeeklySales.orderHistory,
      total: WeeklySales.total,
      admin: adminUser,
    });
    s;
  } catch (error) {}
};
const loadMonthlySales = async (req, res) => {
  try {
    const monthlySales = await adminHelpers.monthlySales();
    const adminUser = await User.findOne({ is_admin: 1 }).lean();

    res.render("admin/sales-page", {
      layout: "admin-layout",
      order: monthlySales.orderHistory,
      total: monthlySales.total,
      admin: adminUser,
    });
    s;
  } catch (error) {}
};
const loadYearlysales = async (req, res) => {
  try {
    const yearlySales = await adminHelpers.yearlySales();
    const adminUser = await User.findOne({ is_admin: 1 }).lean();

    res.render("admin/sales-page", {
      layout: "admin-layout",
      order: yearlySales.orderHistory,
      total: yearlySales.total,
      admin: adminUser,
    });
  } catch (error) {}
};
const loadsalesReport = async (req, res) => {
  try {
    const salesPdf = await adminHelpers.salesPdf(req, res);
  } catch (error) {
    console.log(error.message, "pdfSales controller error");
    res.redirect("/admin/admin-error");
  }
};
module.exports = {
  loadAdminLogin,
  verfiyLogin,
  loadDash,
  adminlogout,
  addUsers,
  insertProducts,
  loadCategory,
  addCategory,
  loadProducts,
  blockUser,
  editUser,
  updateUser,
  addBlockedUsers,
  unblockUser,
  editProducts,
  editProductsView,
  unlistCategory,
  listCategory,
  unlistProducts,
  listProducts,
  loadOrders,
  loadOrderView,
  cancellingOrder,
  rejectingCancell,
  deliveredOrder,
  shippingOrder,
  returnOrder,
  loadSalesPage,
  loadDailySalesPage,
  loadWeeklySales,
  loadMonthlySales,
  loadYearlysales,
  loadsalesReport,
};
