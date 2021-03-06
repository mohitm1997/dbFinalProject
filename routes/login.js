var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "dbproj.cep2q1dc92rr.us-east-1.rds.amazonaws.com",
    user: "root",
    password: "password",
    database: "hulton_hotels"
});

function logIn(req,res){
   //status =1 login successful
    //status=2 email exists but wrong pwd
    //status = 3 email not found
    //status = 4 no email email or pwd provided
    console.log("req body = "+JSON.stringify(req.body));
    if(!req.body.email || !req.body.password){
        status =4;
        res(status);
    }
    else {
     var query = "SELECT * FROM users WHERE Email= \""+req.body.email+"\";";
     var status=0;
        console.log("query = " + query);
     con.query(query, function(err, result){
            if (err) throw err;
            result.forEach(function(record, index){
                if(record['Email']==req.body.email && record['Password']==req.body.password){
                    req.session.user={uid: record['UID'], email: record['Email'], account_type: record['account_type']};
                    console.log("session user = "+JSON.stringify(req.session.user));
                    status=1;
                    res(status);
                }
                else if(record['Email']==req.body.email){
                   status=2;
                   res(status);
                }
                else{
                    status=3;
                    res(status);
                }
            });
        });
    }
}


router.post('/', function(req, res, next) {
    logIn(req, function(status){
        console.log("status = "+status);
        if(status === 1){
        res.send('Login Successful');}
        else if(status === 2){
            res.send("wrong pwd");
        }
        else if (status===3){
            res.send("no email in db");

        }
        else {
            res.send("no data provided");
        }
    });

});

module.exports = router;
