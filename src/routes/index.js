var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.cookies.token) {
    res.redirect('/chat');
  } else {
    res.render('index');
  }
});

module.exports = router;
