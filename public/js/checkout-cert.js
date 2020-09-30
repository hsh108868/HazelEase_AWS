var countDownDate = eval($('#countDownDate').text());
console.log(countDownDate);

var myfunc = setInterval(function() {
  var now = new Date().getTime();
  var timeleft = countDownDate - now;

  var minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((timeleft % (1000 * 60)) / 1000);

  document.getElementById("mins").innerHTML = minutes + "분 "
  document.getElementById("secs").innerHTML = seconds + "초"

  if (timeleft < 0) {
    clearInterval(myfunc);
    document.getElementById("mins").innerHTML = ""
    document.getElementById("secs").innerHTML = ""
    document.getElementById("end").innerHTML = "0분 0초";
  }
}, 1000);
