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
const seller = require('./routes/seller');
const address = require('./routes/address');
const product = require('./routes/product');
const cart = require('./routes/cart');
const wishlist = require('./routes/wishlist');

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

//주소록 관리
app.get('/account/manage-address', address.show);
app.get('/account/manage-address/new', address.saveAddress);
app.post('/account/manage-address/new', address.saveAddress);
app.get("/account/manage-address/edit/:addressId", address.updateAddress);
app.post("/account/manage-address/edit/:addressId", address.updateAddress);
app.get("/account/manage-address/delete/:addressId", address.delete);
app.get("/account/manage-address/default/:addressId", address.default);

// 회원정보 수정 페이지의 요청 처리
app.get("/account/:subPage", user.openSubPage);
app.get("/account/:subPage/:shopId", user.openSubPage);
app.post("/profile", user.saveChanges);


// 판매자의 과리 시스템 페이지의 요청 처리
app.post("/seller/manage-info", seller.manageInfo);

app.post("/seller/manage-product", seller.manageProduct);
app.get("/seller/open-product-info/:productId", seller.openProductInfo);
app.get("/seller/close-product-info", seller.closeProductInfo);
app.get("/seller/delete-product/:productId", seller.deleteProduct);

app.post("/seller/manage-shop", seller.manageShop);
app.get("/seller/open-shop-info/:shopId", seller.openShopInfo);
app.get("/seller/close-shop-info", seller.closeShopInfo);
app.get("/seller/delete-shop/:shopId", seller.deleteShop);

app.post("/seller/add-stock", seller.addStock);
app.get("/seller/update-stock/:productId-:shopId/:productQty", seller.updateStock);
app.get("/seller/delete-stock/:productId-:shopId", seller.deleteStock);
app.get("/seller/show-stocks/:shopId", seller.showStocks);

app.get("/seller/withdraw", seller.withdraw);


// 쇼핑카트, 위시리스트 페이지의 요청 처리
app.get("/my-cart", cart.show);
app.get("/cart/add/:productId", cart.add);
app.get("/cart/delete/:cartId", cart.delete);
app.post("/cart/update/:totalItems", cart.update);
app.post("/apply-coupon", cart.applyCoupon);

app.get("/my-wishlist", wishlist.show);
app.get("/wishlist/add/:productId", wishlist.add);
app.get("/wishlist/delete/:wishlistId", wishlist.delete);
app.get("/wishlist/move/:wishlistId/:productId", wishlist.move);

// 제품 상세내역 페이지의 요청 처리
app.get("/product/:productId", product.showDetails);


// 알림 페이지의 요청 처리
app.get("/my-notification", function(req, res) {
  res.render("notification", {
    user_id: req.session.user_id,
    noOfCartItems: req.session.noOfCartItems,
    noOfWishlistItems: req.session.noOfWishlistItems
  });
});

// 수령여부 페이지의 요청 처리
app.get("/my-receipt", function(req, res) {
  res.render("receipt", {
    user_id: req.session.user_id,
    noOfCartItems: req.session.noOfCartItems,
    noOfWishlistItems: req.session.noOfWishlistItems
  });
});

app.listen(3000, function() {
  console.log("Server has started at port 3000.");
});
