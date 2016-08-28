var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
    let body = req.body;
    console.log("received message");
    console.log(body);
    
    res.render('index', { bodyContent: body });
});

router.get('/', function(req, res, next) {
    res.render('index', { bodyContent: body });
});

module.exports = router;
