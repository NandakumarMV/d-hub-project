const { log } = require("handlebars");

const isLogin = async (req, res, next) => {
  try {
    console.log("gjhhjkjhghjhhjhjhhhhkh");
    if (req.session.adminId && req.session.is_admin === 1) {
      console.log("(req.session.adminId && req.session.is_admin === true)");

      next();
    } else {
      return res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const islogOut = async (req, res, next) => {
  try {
    if (req.session.adminId && req.session.is_admin === 1) {
      res.redirect("/admin/home");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = {
  isLogin,
  islogOut,
};
