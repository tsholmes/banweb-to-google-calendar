// web.js
var express = require("express");
var request = require("request");
var cheerio = require("cheerio");
var lingo = require("lingo");
var scrape = require("./scrape");
var app = express();

app.use(express.static(__dirname + "/static"));
app.use(express.bodyParser());

app.post('/banweb', function(req, res) {
  scrape(req.body.uid,req.body.pass,"201401",function(c){res.send(c);});
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
