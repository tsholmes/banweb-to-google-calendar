var request = require("request");
var cheerio = require("cheerio");
var lingo = require("lingo");

function scrape(uid,pass,term,callback) {
  var jar = request.jar();
  console.log("Initial: " + uid);
  request({ // initial request to fill cookies
    uri:"https://www.banweb.mtu.edu/pls/owa/twbkwbis.P_WWWLogin",
    jar:jar},
    function() {
      console.log("Login: " + uid);
      request.post({ // login request
        uri:"https://www.banweb.mtu.edu/pls/owa/twbkwbis.P_ValLogin",
        jar:jar,
        form:{sid:uid,"PIN":pass}},
        function() {
          console.log("Schedule: " + uid);
          request.post({ // schedule request
            uri:"https://www.banweb.mtu.edu/pls/owa/bwskfshd.P_CrseSchdDetl",
            jar:jar,
            form:{term_in:term}},
            function(err,rsp,body) {
              var $ = cheerio.load(body);
              var courses = [];
              $("table.datadisplaytable").each(function(index) {
                if ((index % 2) == 0) {
                  var course = {};
                  var caption = $("caption",this).text().split(" - ");
                  course.title = caption[0];
                  course.number = caption[1];
                  course.section = caption[2];
                  $("tr",this).each(function() {
                    if ($("acronym",this).length > 0) { // CRN
                      course.crn = parseInt($("td",this).text());
                    } else {
                      var attr = lingo.camelcase($("th",this).text().toLowerCase());
                      var val = $("td",this).text().trim();
                      course[attr] = val;
                    }
                  });
                  courses.push(course);
                } else {
                  // add to last course
                  var course = courses[(index-1)/2];
                  var sched = [];
                  $("tr",this).eq(1).find("td").each(function(){
                    sched.push($(this).text());
                  });
                  course.time = sched[1];
                  course.days = sched[2];
                  course.room = sched[3];
                  course.dates = sched[4];
                }
              });
              console.log(courses);
              callback(courses);
            });
        });
    });
}

module.exports = scrape;
