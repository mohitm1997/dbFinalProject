var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "hulton_hotels"
});

//REGION CALLBACKS
function getHotelServices(hotelList, callback){
  var hotelListing = [];
  hotelList.forEach(function(hotelRecord, index){
    var sql = "SELECT * FROM Service WHERE HotelID = " + hotelRecord['HotelID'];
    con.query(sql, function (err, services) {
      hotelRecord['Services'] = services;
      hotelListing.push(hotelRecord);
      if (hotelList.length - 1 == index){
        callback(hotelListing);
      }
    });
  });
}

function getHotelBreakfasts(hotels, callback){
  var hotelListing = [];
  hotels.forEach(function(hotelRecord, index){
    var sql = "SELECT * FROM Breakfast WHERE HotelID = " + hotelRecord['HotelID'];
    con.query(sql, function (err, breakfasts) {
      console.log(JSON.stringify(breakfasts));
      hotelRecord['Breakfasts'] = breakfasts;
      hotelListing.push(hotelRecord);
      if (hotels.length - 1 == index){
        callback(hotelListing);
      }
    });
  });
}

function loadReviews(reviewSQL, callback){
  con.query(reviewSQL, function (err, reviews) {
    if(err) throw err;
    callback(reviews);
  });
}

function loadReviews(reviewSQL, callback){
  con.query(reviewSQL, function (err, reviews) {
    if(err) throw err;
    callback(reviews);
  });
}

function getRoomReviews(result, req, callback){
  roomList = [];
  con.query(sql, function (err, result) {
      result.forEach(function(roomRecord, index){
        reviewSQL = "SELECT * FROM `Review-Writes` WHERE HotelId = " + req.params.id + " AND Room_no = " + roomRecord['Room_no'];
        loadReviews(reviewSQL, function(reviewList){
          roomRecord['Reviews'] = reviewList;
          roomList.push(roomRecord);
          if (result.length - 1 == index){
            callback(roomList);
          }
       });
    });
  });
}

function checkValidity(data, callback){
	var valid = 1;
	if(data.name==""||data.email==""||data.phone==""||data.email==""||data.password==""||data.confpassword=="") valid=0;
	if(data.password!=data.confpassword) valid=0;
	callback(valid);
}

function registerUser(data, callback){
	var query = "INSERT INTO Customer (Name, Address, Phone_no, Email, Password) VALUES ('"+data.name+"','"+data.address+"','"+data.phone+"','"+data.email+"','"+data.password+"');"
	checkValidity(data, function(valid){
		if(valid) {con.query(query, function(err, rows){
			if (err) throw err;
			console.log("1 Record inserted");
			callback();
		});}
	});
};
//END REGION CALLBACKS

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Hulton Hotel Management' });
});
router.get('/hotels', function(req, res, next) {
  var hotelList = [];
  sql = "SELECT * FROM Hotel";

  con.connect(function(err) {
    con.query(sql, function(err, hotelList){
      getHotelServices(hotelList, function(hotels){
        getHotelBreakfasts(hotels, function(hotelList_){
          res.render('hotels', { title: 'Hulton Hotel Management', hotelListing: JSON.stringify(hotelList_) });
        });
      });
  	});
  });
});

router.get('/rooms/:id', function(req, res, next) {
    var roomList = [];
    sql = "SELECT * FROM `Room-Has` WHERE HotelID = " + req.params.id; //yay mysql injection

    con.connect(function(err) {
      getRoomReviews(sql, req, function(roomList){
        res.render('rooms', { title: 'Hulton Hotel Management', roomListing: JSON.stringify(roomList)});
      });
    });
});

router.get('/myaccount', function(req, res, next) {
    res.render('myaccount', { title: 'Hulton Hotel Management' });
});

router.post('/registerUser', function(req, res, next) {
	registerUser(req.body, function(){
		res.render('index', {title: "Hulton Hotel Management"});
	});
});

module.exports = router;
