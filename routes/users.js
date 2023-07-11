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
const checkoutController = require("../controllers/checkOutController");

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

//checkout
router.get("/checkout", auth.isLogin, cartController.checkoutLoad);
router.post("/submit-checkout", auth.isLogin, checkoutController.placeOrder);
router.get("/order-sucessfull", auth.isLogin, checkoutController.placedOrder);
router.get("/wallet-placed", checkoutController.walletOrder),
  //payment
  router.post("/verify-payment", checkoutController.verifyPayment);
// orders
router.get("/my-orders", auth.isLogin, checkoutController.loadOrders);
router.get("/ordersView", auth.isLogin, checkoutController.loadOrdersView);
router.post("/cancel-order", auth.isLogin, checkoutController.cancellOrder);
router.post("/return-order", auth.isLogin, checkoutController.returnOrder);

//user profile
router.get("/user-profile", auth.isLogin, userControllers.loadUserProfile);
router.get("/address", auth.isLogin, userControllers.loadAddress);
router.post("/address", userControllers.addressList);
// router.post("/add-new-address", userControllers.addNewAddress);
router.get("/delete-address", auth.isLogin, userControllers.deletingAddress);
router.post("/edit-address", userControllers.editAddress);
router.post("/set-as-default", userControllers.settingAsDefault);
router.post("/change-address", cartController.changeAddress);
router.post("/edit-user", uploads.single("image"), userControllers.editUser);

module.exports = router;
