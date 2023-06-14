var express = require("express");
var router = express.Router();
const bodyParser = require("body-parser");
const session = require("express-session");
const config = require("../config/config");
const auth = require("../middlewares/auth");

router.use(session({ secret: config.sessionSecret }));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const userControllers = require("../controllers/userController");
/* GET users listing. */
// router.get("/", function (req, res, next) {
//   res.send("respond with a resource");
// });
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
router.get(
  "/forget-password",
  auth.isLogOut,
  userControllers.forgetpasswordLoad
);

//admin

router.post("/forget-password", userControllers.resetPassword);
module.exports = router;
