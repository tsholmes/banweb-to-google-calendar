var uid;
var pass;
var send;
var res;

window.addEventListener("load",function() {
  uid = document.getElementById("uid");
  pass = document.getElementById("pass");
  send = document.getElementById("send");
  res = document.getElementById("res");
  
  send.addEventListener("click",function() {
    var ps = { uid: uid.value, pass: pass.value };
	var xhr = new XMLHttpRequest();
	xhr.open("POST","/banweb",true);
	xhr.setRequestHeader("Content-type", "application/json");
	xhr.send(JSON.stringify(ps));
	xhr.onreadystatechange = function() {
	  if (xhr.readyState != 4) return;
	  res.innerHTML = xhr.response;
	};
  });
});