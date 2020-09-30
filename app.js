/* ---------- NPM 패키지 ------------- */
require('dotenv').config(); // .env 파일 내에 있는 변수를 이 파일로 가져올 때 process.env.<키변수>로 접근
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");
const session = require("express-session");
const passport = require("passport"),
  LocalStrategy = require('passport-local').Strategy;
const fileUpload = require('express-fileupload');
const cors = require('cors');
const morgan = require('morgan');
const _ = require('lodash');
const QRCode = require('qrcode');

/* ---------- 정의된 모듈 ------------- */
const connection = require("./lib/dbconn"); // DB 연결
const user = require('./routes/user');
const seller = require('./routes/seller');
const address = require('./routes/address');
const product = require('./routes/product');
const qrscan = require('./routes/qrscan');
const cart = require('./routes/cart');
const wishlist = require('./routes/wishlist');
const paymeth = require('./routes/paymeth');
const notification = require('./routes/notification');
const receipt = require('./routes/receipt');

/* ----------------------------------- */
const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(fileUpload({createParentPath: true}));
app.use(cors());
app.use(morgan('dev'));

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
app.post('/account/manage-address', address.add);
app.post('/account/manage-address/:addressId', address.update);
app.get('/account/delete-address/:addressId', address.delete);
app.get('/account/default-address/:addressId', address.default);
app.get('/account/edit-address/:mode/:addressId', address.edit);

// 회원정보 수정 페이지의 요청 처리
app.get("/account/:subPage", user.openSubPage);
app.get("/account/:subPage/:shopId", user.openSubPage);
app.post("/profile", user.saveChanges);

// 결제 수단 페이지의 요청 처리
app.post("/account/payment-method", paymeth.hazelPay);

//리뷰 작성
app.get("/account/write-review/:transId/:orderId/:productId/:type/:shopId", user.writeReview);
app.post("/account/write-review", user.submitReview);

// 판매자의 관리 시스템 페이지의 요청 처리
app.post("/seller/manage-info", seller.manageInfo);

app.post("/seller/manage-product", seller.manageProduct);
app.get("/seller/open-product-info/:productId", seller.openProductInfo);
app.get("/seller/close-product-info", seller.closeProductInfo);
app.get("/seller/delete-product/:productId", seller.deleteProduct);
app.get("/seller/manage-product/delete-image/:imageId", seller.deleteImage);

app.post("/seller/manage-shop", seller.manageShop);
app.get("/seller/open-shop-info/:shopId", seller.openShopInfo);
app.get("/seller/close-shop-info", seller.closeShopInfo);
app.get("/seller/delete-shop/:shopId", seller.deleteShop);

app.post("/seller/add-stock", seller.addStock);
app.get("/seller/update-stock/:productId-:shopId/:productQty", seller.updateStock);
app.get("/seller/delete-stock/:productId-:shopId", seller.deleteStock);
app.get("/seller/show-stocks/:shopId", seller.showStocks);

app.post("/seller/manage-coupon", seller.manageCoupon);
app.get("/seller/open-coupon-info/:couponCode", seller.openCouponInfo);
app.get("/seller/close-coupon-info", seller.closeCouponInfo);
app.get("/seller/delete-coupon/:couponCode", seller.deleteCoupon);

app.get("/seller/withdraw", seller.withdraw);

// QR코드 스캔
app.get("/qrcode", qrscan.openPage);
app.get("/qrcode-error-:errStatus", qrscan.openErrorPage);
app.get("/qrcode/set/:outputLocation", qrscan.outputLocation);
app.get("/qrcode/pid/:productId/type/:type/sid/:shopId", qrscan.addProduct);
app.get("/qrcode/pickup-complete/tid/:transId/sid/:shopId", qrscan.completePickup);
app.get("/qrcode/direct-checkout-complete/oid/:orderId/sid/:shopId", qrscan.completeDirect);

// 쇼핑카트, 위시리스트 페이지의 요청 처리
app.get("/my-cart", cart.show);
app.post("/cart/add/:productId", cart.add);
app.get("/cart/delete/:cartId", cart.delete);
app.post("/cart/update/:totalItems", cart.update);
app.post("/apply-coupon", cart.applyCoupon);
app.post("/cart/process-payment", cart.processPayment);

app.get("/my-wishlist", wishlist.show);
app.get("/wishlist/add/:productId", wishlist.add);
app.get("/wishlist/add/:productId/:type/:shopId", wishlist.add);
app.get("/wishlist/delete/:wishlistId", wishlist.delete);
app.get("/wishlist/delete-toggle/:productId/", wishlist.delete);
app.get("/wishlist/move/:wishlistId/:productId", wishlist.move);
app.get("/wishlist/move/:wishlistId/:productId/:type/:shopId", wishlist.move);

// 제품 상세내역 페이지의 요청 처리
app.get("/product/:productId", product.showDetails);

// 알림 페이지의 요청 처리
app.get("/my-notification", notification.show);
app.get("/my-notification/:receiptMode/:orderId", notification.select);

// 수령여부 페이지의 요청 처리
app.get("/my-receipt", receipt.list);
app.get("/my-receipt/confirm-pickup/:orderId/:productId/:type/:shopId", receipt.confirm);
app.get("/purchase-invoice/:transId", receipt.purchaseDetails);
app.get("/pickup-certificate/:transId-:orderId-:shopId", receipt.pickupCert);
app.get("/checkout-certificate/:orderId", receipt.checkoutCert);

//매장이동
app.get("/open-map/:shopId", product.goToMap);


let port = process.env.PORT;
if (port == null || port == "") {
  port == 3000;
}

app.listen(port, function() {
  console.log("Server has started at port 3000.");
});
