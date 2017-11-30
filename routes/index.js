var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Hulton Hotel Management' });
});
router.get('/reservations', function(req, res, next) {
    res.render('reservations', { title: 'Hulton Hotel Management' });
});

module.exports = router;

