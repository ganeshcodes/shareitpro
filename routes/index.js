var express = require('express');
var router = express.Router();
var azure = require('azure-storage');
var Duplex = require('stream').Duplex;  

var azureblob = azure.createBlobService(
  'shareitfiles',
  'hL1Q5vOz5XSlJ5FCyNHHJLQDKcVVzeRJfADE4Z4JfG/lvLZL0W8IunpTbfDFHADKaik99nNqucUOuXulFw3a0A=='
)

var azurestorageURL = 'https://shareitfiles.blob.core.windows.net/shareitcontainer/';

// [START multer]
const Multer = require('multer');
const multer = Multer({
    storage: Multer.MemoryStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb
    }
});
// [END multer]

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Shareitpro' });
});

router.post('/login', function(req, res, next) {
  console.log('b %o', req.body.action);
  if (req.body.action=='view') {
    res.render('view.pug', { name: req.body.username });
  } else {
    res.render('create.pug', { name: req.body.username, message: {text: ''} });
  }
});

router.post('/create', multer.single('photo'), function (req, res, next) {
  console.log('path : %o',req.file);
  // Upload photo to azure blob storage
  azureblob.createBlockBlobFromStream('shareitcontainer', req.file.originalname, getStream(req.file.buffer), req.file.size, function(error, result, response){
    if(!error){
      // file uploaded
      console.log("%o", response);
      // Now add row to the database table
      var username = req.body.username;
      var title = req.body.title;
      var filename = result.name;
      var modified = result.lastModified;
      var ratings = 0; // No rating so far since this is the first time picture is shared
      var filelink = azurestorageURL + encodeURIComponent(filename);
      console.log(username+' '+title+' '+filename+' '+modified+' '+filelink);
      var msg = {
        text: 'Great! Share another picture!', 
        style: 'alert alert-success'
      };
    } else {
      console.error("error : %o", error);
      var msg = {
        text: 'Oops! Something went wrong!', 
        style: 'alert alert-danger'
      };
    }
    res.render('create.pug', { name: req.body.username, message: msg});
  });
});

function getStream(buffer){
  var stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
module.exports = router;
