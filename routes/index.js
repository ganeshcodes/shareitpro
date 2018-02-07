var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Shareitpro' });
});


router.post('/login', function(req, res, next) {
  console.log('b %o', req.body.action);
  if (req.body.action=='view') {
    res.render('view.pug', { name: req.body.username });
  } else {
    res.render('create.pug', { name: req.body.username });
  }
});

module.exports = router;
