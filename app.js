/* ---------- NPM 패키지 ------------- */
require('dotenv').config(); // .env 파일 내에 있는 변수를 이 파일로 가져올 때 process.env.<키변수>로 접근
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");
const session = require("express-session");
const passport = require("passport")
  , LocalStrategy = require('passport-local').Strategy;

/* ---------- 정의된 모듈 ------------- */
const connection = require("./lib/dbconn"); // DB 연결
const user = require('./routes/user');
const product = require('./routes/product');

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

// 홈 페이지의 요청 처리
app.get("/home", product.showOutlines);

// 회원가입, 로그인, 로그아웃 페이지의 요청 처리
app.get("/signup", user.signup);
app.post("/signup", user.signup);

app.get("/login", user.login);
app.post("/login", user.login);

app.get("/logout", user.logout);

// 회원정보 수정 페이지의 요청 처리
app.get("/profile", user.profile);
app.post("/profile", user.saveChanges);

// 쇼핑카트, 위시리스트 페이지의 요청 처리
app.get("/my-cart", product.showMyCart);
app.get("/cart/add/:productId", product.cartAdd);
app.get("/cart/delete/:cartId", product.cartDelete);
app.post("/cart/update/:totalItems", product.cartUpdate);

app.get("/my-wishlist", product.showMyWishlist);
app.get("/wishlist/add/:productId", product.wishlistAdd);
app.get("/wishlist/delete/:wishlistId", product.wishlistDelete);
app.get("/wishlist/move/:wishlistId/:productId", product.wishlistMove);

// 제품 상세내역 페이지의 요청 처리
app.get("/product/:productId", product.showDetails);

// 알림 페이지의 요청 처리
app.get("/notification", function(req, res) {
  res.render("notification", { user_id: req.session.user_id });
});

// 수령여부 페이지의 요청 처리
app.get("/receipt", function(req, res) {
  res.render("receipt", { user_id: req.session.user_id });
});



app.listen(3000, function() {
  console.log("Server has started at port 3000.");
});
