/* ---------- NPM 패키지 ------------- */
require('dotenv').config(); // .env 파일 내에 있는 변수를 이 파일로 가져올 때 process.env.<키변수>로 접근
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");
const session = require("express-session");
const passport = require("passport")
  , LocalStrategy = require('passport-local').Strategy;;

/* ---------- 정의된 모듈 ------------- */
const connection = require("./lib/dbconn"); // DB 연결
const user = require('./routes/user');

/* ----------------------------------- */

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// DB연결와 체크
db = connection.db;
db.connect(function(err) {
  if (err) throw err;
  console.log("Database connected!");
});

// 세션 사용
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60*60*1000 }
}));

/* --- 페이지 개발할 때 수정하는 부분 --- */
app.get("/", function (req, res) {
  res.redirect("/home");
});

app.get("/home", function (req, res) {
  sess = req.session;
  res.render("home", { user_id: sess.user_id });
});

app.get("/signup", user.signup);
app.post("/signup", user.signup);

app.get("/login", user.login);
app.post("/login", user.login);

app.get("/logout", user.logout);

app.get("/profile", user.profile);

app.listen(3000, function() {
  console.log("Server has started at port 3000.");
});
