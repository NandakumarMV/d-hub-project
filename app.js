require("dotenv").config(); //var to const
var createError = require("http-errors");
var express = require("express");
var path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser"); //remove
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
const hbs = require("express-handlebars");
const config = require("./config/config");
const handlebarsHelpers = require("handlebars-helpers");
// mongoose.connect();

// Establish Mongoose connection
mongoose
  .connect("mongodb://127.0.0.1:27017/d-hub_users", {
    //env
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB:", error);
  });

var adminRouter = require("./routes/admin");
var usersRouter = require("./routes/users");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    layoutsDir: __dirname + "/views/layouts/",
    partialsDir: __dirname + "/views/partials/",
    helpers: handlebarsHelpers(),
  })
);

app.use(session({ secret: config.sessionSecret }));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/admin", adminRouter);
app.use("/", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404)); // middleware
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
