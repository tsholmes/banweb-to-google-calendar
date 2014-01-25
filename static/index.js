var steps = [];
var stepcells = [];
var stepfuncs = [];

var courses;
var calid;

function setStep(idx) {
  for (var i = 1; i <= 5; i++) {
    steps[i].style.display = (i == idx)?"block":"none";
    stepcells[i].style.backgroundColor = (i == idx)?"#FFF":"#888";
  }
  if (stepfuncs[idx]) stepfuncs[idx]();
}

window.addEventListener("load",function() {
  for (var i = 1; i <= 5; i++) {
    steps[i] = document.getElementById("step" + i);
    stepcells[i] = document.getElementById("step" + i + "cell");
  }
  stepfuncs[1] = step1;
  stepfuncs[2] = step2;
  stepfuncs[3] = step3;
  stepfuncs[4] = step4;
  stepfuncs[5] = step5;
  setStep(1);
});

function step1() { // Banweb login
  var uid = document.getElementById("uid");
  var pass = document.getElementById("pass");
  var send = document.getElementById("send");
  var res = document.getElementById("res");
  var banwebform = document.getElementById("banwebform");
  
  banwebform.onsubmit = function() {
    var ps = { uid: uid.value, pass: pass.value };
    var xhr = new XMLHttpRequest();
    xhr.open("POST","/banweb",true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.send(JSON.stringify(ps));
    xhr.onreadystatechange = function() {
      if (xhr.readyState != 4) return;
      res.innerHTML = xhr.response;
      courses = JSON.parse(xhr.response);
      setStep(2);
    };
    return false;
  };
}

function step2() { // Google auth
  var config = {  client_id: client_id,
                  scope: "https://www.googleapis.com/auth/calendar",
                  immediate: false,
                  authuser: -1 };
  gapi.auth.authorize(config, function() {
    gapi.client.load('calendar', 'v3', function() {
      setStep(3);
    });
  });
}

function step3() { // Calendar select
  gapi.client.calendar.calendarList.list({minAccessRole:"writer"}).execute(function(res){
    var calform = document.getElementById("calform");
    var calselect = document.getElementById("calselect");
    var calsubmit = document.getElementById("calsubmit");
    calform.onsubmit = function() {
      calid = calselect.value;
      setStep(4);
      return false;
    };
    for (var x in res.items) {
      var id = res.items[x].id;
      var name = res.items[x].summary;
      var rand = Math.random();
      var radio = document.createElement("option");
      radio.value = id;
      radio.innerHTML = name;
      radio.id = rand;
      calselect.appendChild(radio);
    }
  });
}

function step4() { // Course import
  for (var x in courses) {
    var course = courses[x];
    if (course.time == "TBA") continue;
    gapi.client.calendar.events.insert({calendarId:calid,resource:courseToEvent(course)})
      .execute((function(course){
        return function(res){
          steps[4].appendChild(document.createElement("br"));
          steps[4].appendChild(document.createTextNode("Added: " + course.number + " - " + course.title + " - " + course.section));
          console.log(res);
        };
      })(course));
  }
}

function step5() { // Done
  alert("Done!");
}

function apiload() {
  gapi.client.setApiKey(api_key);
}

function daysToDays(days) {
  var res = [];
  var all = ["U","M","T","W","R","F","S"];
  for (var x in all) {
    res.push(days.indexOf(all[x]) != -1);
  }
  return res;
}

function pad0(str,wid) {
  str = "" + str;
  if (str.length >= wid) return str;
  return pad0("0" + str, wid);
}

function toISOTime(d) {
  var res = d.getFullYear() + "-" +
            pad0(d.getMonth()+1,2) + "-" + 
            pad0(d.getDate(),2) + "T" +
            pad0(d.getHours(),2) + ":" + 
            pad0(d.getMinutes(),2) + ":" + 
            pad0(d.getSeconds(),2) + "." + 
            pad0(d.getMilliseconds(),3);
  if (d.getTimezoneOffset() > 0) {
    res += "-" + pad0(d.getTimezoneOffset()/60,2) + ":00";
  } else {
    res += "+" + pad0(d.getTimezoneOffset()/-60,2) + ":00";
  }
  return res;
}

function toRTime(d) {
  return    d.getFullYear() +
            pad0(d.getMonth()+1,2) +
            pad0(d.getDate(),2) + "T" +
            pad0(d.getHours(),2) +
            pad0(d.getMinutes(),2) +
            pad0(d.getSeconds(),2) + "Z";
}

function genRRULE(days,end) {
  var res = "RRULE:FREQ=WEEKLY;UNTIL=" + toRTime(end) + ";WKST=SU;BYDAY=";
  var count = 0;
  var dd = ["SU","MO","TU","WE","TH","FR","SA"];
  for (var i = 0; i < 7; i++) {
    if (days[i]) {
      if (count > 0) res += ",";
      res += dd[i];
      count++;
    }
  }
  return res;
}

function courseToEvent(course) {
  var ev = {};
  ev.summary = course.number;
  ev.description = course.title + " - " + course.assignedInstructor;
  ev.location = course.room;
  var days = daysToDays(course.days);
  var dates = course.dates.split(" - ");
  dates = [new Date(dates[0]),new Date(dates[1])];
  dates[1] = new Date(dates[1].getTime() + 24 * 60 * 60 * 1000);
  var startday = new Date(dates[0]);
  while (!days[startday.getDay()]) {
    startday = new Date(startday.getTime() + 24 * 60 * 60 * 1000);
  }
  var times = course.time.split(" - ");
  var starttime = new Date(startday.toDateString() + " " + times[0]);
  var endtime = new Date(startday.toDateString() + " " + times[1]);
  ev.start = {dateTime:toISOTime(starttime), timeZone: "America/New_York"};
  ev.end = {dateTime:toISOTime(endtime), timeZone: "America/New_York"};
  ev.recurrence = [genRRULE(days,dates[1])];
  console.log(ev);
  return ev;
}