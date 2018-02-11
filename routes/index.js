var express = require('express');
var router = express.Router();
var azure = require('azure-storage');
var Duplex = require('stream').Duplex;  
var db = require('../lib/db');
var Request = require('tedious').Request;

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
  var username = req.body.username;
  if (req.body.action=='view') {
    var results = [];
    // Query all the photos shared by other users
    var query = "select * from shareitmain where username!='"+username+"'";
    var request = new Request(query, function(err,rowcount,rows){
      if (err){
        console.log('error %o',err);
        var error = {
          text: 'Something went wrong. Try again later!', 
          style: 'alert alert-danger'
        };
        res.render('view.pug', { name: req.body.username, message: error });
      }
      console.log('rowcount = %o',rowcount);
      console.log('rows = %o',results);
      res.render('view.pug', { name: username, message:{text:''}, rows: results });
    });
    request.on('row', function(columns) {
      var row = {};
      columns.forEach(function(column) {
          console.log("%s\t%s", column.metadata.colName, column.value);
          row[column.metadata.colName] = column.value;
      });
      results.push(row);
    });
    db.execSql(request);
  } else {
    res.render('create.pug', { name: username, message: {text: ''} });
  }
});

router.post('/create', multer.single('photo'), function (req, res, next) {
  console.log('path : %o',req.file);
  // Upload photo to azure blob storage and the details to database
  azureblob.createBlockBlobFromStream('shareitcontainer', req.file.originalname, getStream(req.file.buffer), req.file.size, function(error, result, response){
    if(!error){
      // file uploaded
      console.log("%o", response);
      // Now add row to the database table
      var username = req.body.username;
      var title = req.body.title;
      var filename = result.name;
      var modified = result.lastModified;
      var ratings = 0, ratingscount = 0;
      var filelink = azurestorageURL + encodeURIComponent(filename);
      // Create a query to insert row
      var query = "INSERT INTO shareitmain(username, title, modified, ratings, filelink, ratingscount) VALUES('"+username+"','"+title+"','"+modified+"','"+ratings+"','"+filelink+"','"+ratingscount+"')";
      var request = new Request(query, function(err,rowcount,rows){
        if (err){
          console.log('error %o',err);
          var error = {
            text: 'Something went wrong. Try again later!', 
            style: 'alert alert-danger'
          };
          res.render('create.pug', { name: req.body.username, message: error });
        }
        console.log(rowcount + ' row(s) returned');
        var success = {
          text: 'Photo shared successfully. Try sharing another one!', 
          style: 'alert alert-success'
        };
        res.render('create.pug', { name: req.body.username, message: success });
      });
      /*request.on('row', function(columns) {
        columns.forEach(function(column) {
            console.log("%s\t%s", column.metadata.colName, column.value);
         });
      });*/
      db.execSql(request);
      console.log(username+' '+title+' '+filename+' '+modified+' '+filelink);
    } else {
      console.error("error : %o", error);
      var msg = {
        text: 'Oops! Something went wrong!', 
        style: 'alert alert-danger'
      };
      res.render('create.pug', { name: req.body.username, message: msg});
    }
  });
});

function getStream(buffer){
  var stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
module.exports = router;
