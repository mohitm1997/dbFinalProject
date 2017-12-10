var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var index = require('./routes/index');
var myaccount = require('./routes/myaccount');
var hotels = require('./routes/hotels');
var rooms = require('./routes/rooms');
var registerUser = require('./routes/registeruser');
var login = require('./routes/login');
var stats = require('./routes/stats');

var RoomModel = require('./roommodel.js');
var UserModel= require('./usermodel');

var app = express();
var mysql = require('mysql');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: "Super Secret Fam"}));

app.use('/', index);
app.use('/myaccount',myaccount);
app.use('/hotels',hotels);
app.use('/rooms',rooms);
app.use('/registerUser', registerUser);
app.use('/login',login);
app.use('/stats', stats);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
