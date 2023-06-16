const User = require("../models/userModel");
const Product = require("../models/productModels");
const bcrypt = require("bcrypt");
const { userLogout } = require("./userController");
const multer = require("multer");
const Category = require("../models/categoryModel");
const { log } = require("handlebars/runtime");
// const upload = multer({ dest: "./public/uploads/" });

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
    console.log(userData);
    if (userData) {
      const passMatch = await bcrypt.compare(password, userData.password);
      console.log(passMatch);
      if (passMatch) {
        if (userData.is_admin === 0) {
          res.render("admin/login", { layout: "admin-layout" });
        } else {
          req.session.user_id = userData._id;
          console.log(req.session.user_id);
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
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const loadProducts = async (req, res) => {
  try {
    const updateProducts = await Product.find().lean();
    const productWithSerialNumber = updateProducts.map((products, index) => ({
      ...products,
      serialNumber: index + 1,
    }));
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
    const newProduct = new Product({
      brand: req.body.brand,
      productName: req.body.productname,
      category: req.body.category,
      price: req.body.price,
      // offPrice:dealprice,
      // quantity:stock,
      images: req.file.filename,
      description: req.body.description,
      // strapColour:req.body.strapColour,
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
      const productWithSerialNumber = updateProducts.map((products, index) => ({
        ...products,
        serialNumber: index + 1,
      }));
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
    const updatedcategory = await Category.find().lean();
    const categoryWithSerialNumber = updatedcategory.map((category, index) => ({
      ...category,
      serialNumber: index + 1,
    }));
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
      const categoryWithSerialNumber = updatedcategory.map(
        (category, index) => ({
          ...category,
          serialNumber: index + 1,
        })
      );

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

module.exports = {
  loadAdminLogin,
  verfiyLogin,
  loadDash,
  adminlogout,

  insertProducts,
  loadCategory,
  addCategory,
  loadProducts,
};
