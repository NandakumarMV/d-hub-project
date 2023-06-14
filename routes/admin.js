var express = require("express");
var session = require("express-session");
const auth = require("../middlewares/adminAuth");

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
router.get("/", auth.islogOut, adminController.loadAdminLogin);
router.post("/", adminController.verfiyLogin);
router.get("/home", auth.isLogin, adminController.loadDash);
router.get("/logout", auth.isLogin, adminController.adminlogout);

router.get("/table", adminController.tableData);
router.get("*", (req, res) => {
  res.redirect("/admin");
});

module.exports = router;
