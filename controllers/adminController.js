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
    // console.log(req.body);
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    // console.log(userData);
    if (userData) {
      const passMatch = await bcrypt.compare(password, userData.password);
      // console.log(passMatch);
      if (passMatch) {
        if (userData.is_admin === 0) {
          res.render("admin/login", { layout: "admin-layout" });
        } else {
          req.session.user_id = userData._id;
          // console.log(req.session.user_id);
          res.redirect("home");
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
    User.findById({ _id: req.session.user_id });

    res.render("admin/home", { layout: "admin-layout" });
  } catch (error) {
    console.log(error.message);
  }
};
const adminlogout = async (req, res) => {
  try {
    // console.log("hy......................................................");
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const loadProducts = async (req, res) => {
  try {
    const updateProducts = await Product.find().lean();
    console.log(
      "mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmupdateProducts"
    );

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
// const insertProducts = async (req, res) => {
//   try {
//     const newProduct = new Product({
//       brand: req.body.brand,
//       productname: req.body.productname, // Updated field name

//       category: req.body.category,
//       price: req.body.price,
//       // inStock: req.body.inStock,
//       images: req.file.filename,
//       description: req.body.description,
//     });

//     const addProductData = await newProduct.save();

//     if (addProductData) {
//       const category = await Category.findOneAndUpdate(
//         { category: req.body.category },
//         { $push: { products: newProduct._id } },
//         { new: true }
//       );

//       const updatedProducts = await Product.find().lean();
//       const productWithSerialNumber = updatedProducts.map((product, index) => ({
//         ...product,
//         serialNumber: index + 1,
//       }));
//       const categories = await Category.find().lean();

//       return res.render("admin/add-products", {
//         layout: "admin-layout",
//         products: productWithSerialNumber,
//         categories: categories,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

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
  console.log(userData);
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
    const id = req.query.id;
    // console.log(id);
    const userData = await User.findByIdAndUpdate(
      { _id: id },
      { $set: { blocked: true } }
    );
    // console.log(userData);
    res.redirect("/admin/user");
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
// const editProductsView = async (req, res) => {
//   try {
//     const id = req.query.id;
//     console.log("ID:", id);

//     const categories = await Category.find({ unlist: false }).lean();
//     const categoryData = {};
//     categories.forEach((data) => {
//       categoryData[data._id.toString()] = {
//         _id: data._id.toString(),
//         category: data.category,
//       };
//     });

//     const categoryLookup = {};
//     categories.forEach((category) => {
//       categoryLookup[category._id.toString()] = category.category;
//     });

//     const updatedProduct = await Product.findById(id).lean();

//     if (updatedProduct) {
//       const productWithCategoryName = {
//         ...updatedProduct,
//         category: categoryLookup[updatedProduct.category],
//       };
//       console.log("CategoryData:", categoryData);
//       res.render("admin/edit-product", {
//         product: productWithCategoryName,
//         layout: "admin-layout",
//         categories: categoryData,
//       });
//     } else {
//       console.log("Product not found");
//       res.redirect("/admin/products");
//     }
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };
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

    const categoryLookup = [];
    categories.forEach((category) => {
      categoryLookup[category._id.toString()] = category.category;
    });

    // Define the lookupCategory helper function
    const lookupCategory = function (categoryId) {
      console.log("categoryId:", categoryId);
      console.log("categoryLookup:", categoryLookup);
      return categoryLookup[categoryId];
    };

    const updatedProduct = await Product.findById(id).lean();
    console.log(lookupCategory(updatedProduct.category), "lookupCategory");
    console.log(categoryLookup);
    console.log(updatedProduct.category);
    console.log(updatedProduct);
    console.log("updatedProduct.category:", updatedProduct.category);
    console.log("categoryLookup keys:", Object.keys(categoryLookup));

    if (updatedProduct) {
      const productWithCategoryName = {
        ...updatedProduct,
        category: lookupCategory(updatedProduct.category),
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

// const editProducts = async (req, res) => {
//   try {
//     const id = req.query.id;
//     console.log(id);
//     console.log(req.files, "hi image");
//     const product = await Product.findById({ _id: id }).lean();
//     console.log(req.body.category, "coming to updating");
//     let updatedProductData = {
//       brand: req.body.brand,
//       productname: req.body.productname,
//       price: req.body.price,
//       description: req.body.description,
//       category: req.body.category,
//       images: product.images,
//     };

//     if (req.files && req.files.length > 0) {
//       updatedProductData.images = req.files.map((file) => file.filename);
//     }

//     const product1 = await Product.findByIdAndUpdate(
//       { _id: req.query.id },
//       { $set: updatedProductData }
//     );

//     res.redirect("/admin/products");
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };
// const editProducts = async (req, res) => {
//   try {
//     const id = req.query.id;
//     const product = await Product.findById(id).lean();

//     let updatedProductData = {
//       brand: req.body.brand,
//       productname: req.body.productname,
//       price: req.body.price,
//       description: req.body.description,
//       category: req.body.category,
//       images: product.images,
//     };

//     if (req.files && req.files.length > 0) {
//       updatedProductData.images = req.files.map((file) => file.filename);
//     }

//     const product1 = await Product.findByIdAndUpdate(
//       id,
//       { $set: updatedProductData },
//       { new: true }
//     );

//     res.redirect("/admin/products");
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

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
};
