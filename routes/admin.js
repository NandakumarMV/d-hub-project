var express = require("express");
var session = require("express-session");
const adminAuth = require("../middlewares/adminAuth");
var multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploads = multer({ storage: storage });
// router.use(session({ secret: config.sessionSecret }));

var router = express.Router();
var config = require("../config/config");
var bodyParser = require("body-parser");
var adminController = require("../controllers/adminController");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

/* GET home page. */
// router.get("/admin", function (req, res, next) {
//   res.render("index", { title: "Express" });
// });

router.get("/", adminAuth.islogOut, adminController.loadAdminLogin);
router.post("/", adminController.verfiyLogin);
router.get("/home", adminAuth.isLogin, adminController.loadDash);
router.get("/logout", adminAuth.isLogin, adminController.adminlogout);
router.get("/add-products", adminAuth.isLogin, adminController.loadProducts);
router.post(
  "/add-products",
  uploads.array("images", 5),
  adminController.insertProducts
);

//otp verification

//category loading

router.get("/category", adminAuth.isLogin, adminController.loadCategory);
router.post("/category", adminController.addCategory);
router.get("/users", adminAuth.isLogin, adminController.addUsers);
router.get(
  "/unlist-category",
  adminAuth.isLogin,
  adminController.unlistCategory
);
router.get("/list-category", adminAuth.isLogin, adminController.listCategory);
//edit users
router.get("/edit-user", adminAuth.isLogin, adminController.editUser);
router.post("/edit-user", adminController.updateUser);

//block user
router.get("/block", adminAuth.isLogin, adminController.blockUser);
router.get("/blocked-users", adminController.addBlockedUsers);

//unblock user
router.get("/unblocked-users", adminAuth.isLogin, adminController.unblockUser);

//edit products
router.get("/edit-product", adminController.editProductsView);
router.post(
  "/edit-product",
  uploads.array("images", 5),
  adminController.editProducts
);
router.get(
  "/unlist-products",
  adminAuth.isLogin,
  adminController.unlistProducts
);
router.get("/list-products", adminAuth.isLogin, adminController.listProducts);

router.get("*", (req, res) => {
  res.redirect("/admin");
});

module.exports = router;
