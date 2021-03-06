var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "dbproj.cep2q1dc92rr.us-east-1.rds.amazonaws.com",
    user: "root",
    password: "password",
    database: "hulton_hotels"
});

function loadReviews(reviewSQL, callback){
    con.query(reviewSQL, function (err, reviews) {
        if(err) throw err;
        callback(reviews);
    });
}

function getRoomReviews(result, req, callback){
    roomList = [];
    con.query(sql, function (err, result) {
       if (err) throw err;
        result.forEach(function(roomRecord, index){
            reviewSQL = "SELECT * FROM `review-writes` WHERE HotelId = " + req.params.id + " AND Room_no = " + roomRecord['Room_no'];
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
router.post('/rooms/breakfast/:id', function(req, res, next){
  var breakfastSQL = "SELECT * FROM breakfast WHERE HotelID = " + req.params.id;
  con.connect(function(err) {
    con.query(breakfastSQL, function (err, breakfasts) {
        if(err) throw err;
        res.send(JSON.stringify(breakfasts));
    });
  });
});

router.post('/rooms/services/:id', function(req, res, next){
  var serviceSQL = "SELECT * FROM service WHERE HotelID = " + req.params.id;
  con.connect(function(err) {
    con.query(serviceSQL, function (err, services) {
        if(err) throw err;
        res.send(JSON.stringify(services));
    });
  });
});

function getCID(getCIDSQL, callback){
  con.query(getCIDSQL, function (err, CIDs) {
      if(err) throw err;
      callback(CIDs[0]);
  });
}

router.post('/rooms/cclist/:email', function(req, res, next){
    var getCIDSQL = "SELECT CID FROM customer WHERE Email = '" + req.params.email + "'";
  con.connect(function(err){
    getCID(getCIDSQL, function(CID){
      var getCCSQL = "SELECT Cnumber, Type, CID FROM creditcard WHERE CID = " + CID['CID'];
      con.query(getCCSQL, function (err, CCs) {
          if(err) throw err;
          res.send(JSON.stringify(CCs));
      });
    });
  });
});

router.post('/rooms/findReservations/', function(req, res, next){
  var sql = "SELECT inDate, outDate FROM reserves WHERE HotelID = " + req.body.hotelid + " AND Room_no = " + req.body.roomno + ";";
  /*console.log(sql);
  for (var i = 0; i < sql.length; i++) {
    console.log(sql.charAt(i) + " " + sql.charCodeAt(i));
  }
  sql = sql.replace(/&nbsp;/g,' ');
  console.log(sql);*/
  con.connect(function(err){

      con.query(sql, function(err, reservations){
        if (err) throw err;
        res.send(JSON.stringify(reservations));
    });
  });
});

router.get('/:id', function(req, res, next) {
    var roomList = [];
    sql = "SELECT * FROM `room-has` WHERE HotelID = " + req.params.id; //yay mysql injection
    con.connect(function(err) {
        getRoomReviews(sql, req, function(roomList){
            roomList.forEach(function(rm){
              var today = new Date();
              if(rm['SDate'] && rm['EDate'] && rm['SDate'] < today && today < rm['EDate']){
                rm['Price'] = rm['Discount'];
              }
            });
            res.render('rooms', { title: 'Hulton Hotel Management',
                                  userString: JSON.stringify(req.session.user),
                                  roomListing: JSON.stringify(roomList)
                                });
        });
    });
});

function insertInvoice(sql, callback){
  con.query(sql, function (err, results) {
      if (err) throw err;
      console.log("insert invoice results: "+JSON.stringify(results));
      callback(results.insertId);
  });
}

function insertRooms(rooms, hotels, sdates, edates, invoiceID, callback){
  var sql = "INSERT INTO reserves VALUES ";
  console.log(JSON.stringify(rooms));
  Object.keys(rooms).forEach(function(index){
    if(index > 0){
      sql += ',';
    }
    if(Array.isArray(edates)){
      sql += " (" + invoiceID + ", " + hotels[index] + ", " + rooms[index] + ", '" + edates[index] + "', '" + sdates[index] + "' )";
    }
    else{
      sql += " (" + invoiceID + ", " + hotels + ", " + rooms + ", '" + edates + "', '" + sdates + "' )";
    }
  });
  sql += ";";
  con.query(sql, function (err, results) {
      callback();
  });
}

function insertBreakfasts(invoiceID, hotel, inData, callback){
  var sql = "INSERT INTO includes VALUES ";
  var inserted = false;
  Object.keys(inData).forEach(function (key, index) {
    if(key == "Continental" || key =="French"|| key =="American"|| key =="Italian"|| key =="English"){
      if(inData[key] != "" && inData[key] && inData[key] > 0){
        if(inserted){
          sql += ",";
        }
        inserted = true;
        sql += " ( " + invoiceID + " , " + hotel + " , '" + key + "' , " + inData[key] + ")";
      }
    }
  });
  con.query(sql, function (err, results) {
      callback();
  });
}

function insertServices(invoiceID, hotel, inData, callback){
  var sql = "INSERT INTO contains VALUES ";
  var inserted = false;
  Object.keys(inData).forEach(function (key, index) {
    if(key == "Laundry" || key == "Massage" || key == "Spa" || key == "Airport drop-off"|| key == "Airport pick-up" || key == "Parking"|| key == "Valet"){
      if(inData[key] != "" && inData[key] > 0){
        if(inserted){
          sql += ",";
        }
        inserted = true;
        sql += " ( " + invoiceID + " , " + hotel + " , '" + key + "' , " + inData[key] + ")";
      }
    }
  });
  con.query(sql, function (err, results) {
      callback();
  });
}

router.post('/rooms/reserve', function(req, res, next) {
    var inData = req.body;
    var today = new Date();
    var TotalAmt = inData['price'];
    var Cnumber = inData['credit'];
    var CID = inData['CID'];
    var rooms = inData['roomid'];
    var hotels = inData['hotelid'];
    var sdates = inData['sdate'];
    var edates = inData['edate'];
    //so getMonth is zero indexed but getDate is 1 indexed wtf
    var ResDate = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
    var sql = "INSERT INTO `reservation-makes` (ResDate , TotalAmt,  CID,  Cnumber)   VALUES  (" +
              "'" + ResDate + "',  " + TotalAmt + ",  " + CID + ",  " + Cnumber + " )";
    con.connect(function(err) {
      insertInvoice(sql, function(invoiceID){
          insertRooms(rooms,hotels, sdates, edates, invoiceID, function(){
            insertBreakfasts(invoiceID, hotels[0], inData, function(){
              insertServices(invoiceID, hotels[0], inData, function(){
                res.redirect('/');
              });
            });
          });
        });
    });
});

module.exports = router;
