var express = require("express");
var router = express.Router();
const bodyParser = require("body-parser");
const session = require("express-session");
const config = require("../config/config");
const auth = require("../middlewares/auth");
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

router.use(session({ secret: config.sessionSecret }));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const userControllers = require("../controllers/userController");
const cartController = require("../controllers/cartController");

router.get("/signup", auth.isLogOut, userControllers.loadSignUp);
router.post("/signup", userControllers.insertUser);

router.get("/verify", userControllers.verfiyMail);

router.get("/login", auth.isLogOut, userControllers.loginLoad);

router.post("/login", userControllers.verfiyLogin);
router.get("/", auth.isLogOut, userControllers.loginLoad);
router.get("/home", auth.isLogin, userControllers.loadHome);
router.get("/logout", auth.isLogin, userControllers.userLogout);

router.get("/forget", auth.isLogOut, userControllers.forgetLoad);
router.post("/forget", userControllers.forgetVerify);
router.post("/forget-password", userControllers.resetPassword);

router.get("/otp-verification", userControllers.pageOtp);
router.post("/otp-verification", userControllers.sendOtp);
router.get("/otp-verified", auth.isLogOut, userControllers.loadOtpHome);
// router.post("/otp-verified",  userControllers.);

router.get(
  "/forget-password",
  auth.isLogOut,
  userControllers.forgetpasswordLoad
);

// product load

router.get("/load-product", auth.isLogin, userControllers.loadProductView);

//cart loading
router.post("/add-cart", cartController.addToCart);
router.get("/load-cart", auth.isLogin, cartController.loadingCartPage);
router.post("/change-product-quantity", cartController.changeProductQuantity);

//user profile
router.get("/user-profile", auth.isLogin, userControllers.loadUserProfile);
router.get("/address", auth.isLogin, userControllers.loadAddress);
router.post("/address", userControllers.addressList);

router.post("/edit-user", uploads.single("image"), userControllers.editUser);
module.exports = router;
