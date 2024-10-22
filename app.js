require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const passport = require('passport');
const session = require("express-session");
const MongoStore = require('connect-mongo'); // Add connect-mongo for session storage

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Session configuration with MongoDB
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET, // Ensure this is kept secure in production
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,  // Replace with your MongoDB connection string
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // Optional: Set cookie expiry to 1 day
  }
}));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
