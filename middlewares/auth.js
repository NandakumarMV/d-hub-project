const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
    } else {
      res.redirect("/login");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

const isLogOut = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      res.redirect("/home");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = {
  isLogin,
  isLogOut,
};
