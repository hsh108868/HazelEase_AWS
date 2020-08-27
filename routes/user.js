const bcrypt = require("bcrypt");
const saltRounds = 10;
const currentYear = new Date().getFullYear();
const month30 = ["04", "06", "09", "11"]; // 30일까지의 월
const minYear = 1500;

const fn = require("../lib/other"); // 정의된 함수들 가져오기

/* ------------------------------ signup 처리 호출 ------------------------------ */
exports.signup = function(req, res) {
  var message = "";
  var pw = req.body.password;
  var pw_c = req.body.password_confirm;
  var inputYear = req.body.yy;
  var inputMonth = req.body.mm;
  var inputDate = req.body.dd;
  var regUserids = [];

  db.query('SELECT ?? FROM ??', ['user_id', 'member'], function(err, results, fields) {
    results.forEach(function(member) {
      regUserids.push(member.user_id);
    });

    if (req.method == "POST") { // 요청이 POST일 때만 처리
      // 최대 해당 월의 일 설정
      if (month30.includes(inputMonth))
        maxDate = 30;
      else if (inputMonth == 2 )
        maxDate = 29;
      else
        maxDate = 31;

      // 회원가입 처리
      if (regUserids.includes(req.body.userid)) { // 아이디 중복 체크
        message = "아이디가 이미 존재되어 있습니다!";
        res.render('signup.ejs', { message: message, statusCode: 400, regUserids: regUserids });
      } else if (inputYear <= minYear || inputYear > currentYear || inputMonth == "" || inputDate <= 0 || inputDate > maxDate) { // 생년월일 체크
        message = "생년월일을 제대로 입력하세요!";
        res.render('signup.ejs', { message: message, statusCode: 400, regUserids: regUserids });
      } else if (pw != pw_c) { // 비밀번호 확인
        message = "비밀번호가 일치하지 않습니다.";
        res.render('signup.ejs', { message: message, statusCode: 400, regUserids: regUserids });
      } else { // DB에 회원정보 저장
        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
          var post = {
            fullname: req.body.fullname,
            user_id: req.body.userid,
            password: hash,
            gender: req.body.gender,
            birth: req.body.yy + "-" + req.body.mm + "-" + req.body.dd,
            email: req.body.email,
            phone: req.body.no_tel,
          }

          var query = db.query('INSERT INTO member SET ?', post, function(error, results, fields) {
            if (error) throw error;
            message = "회원가입이 완료되었습니다.";
            res.render('login.ejs', { message: message, statusCode: 200 });
          });
        });
      }
    } else { // 요청이 POST가 아닐떄 회원가입 페이지 보내기
      res.render('signup.ejs', { message: message, regUserids: regUserids });
    }

    /* Status Code:
     * 1xx informational response – the request was received, continuing process (정상 반응)
     * 2xx successful – the request was successfully received, understood, and accepted (성공적으로 됐을 때)
     * 3xx redirection – further action needs to be taken in order to complete the request (계속 해야 할 때)
     * 4xx client error – the request contains bad syntax or cannot be fulfilled (사용자가 잘못했을 때)
     * 5xx server error – the server failed to fulfill an apparently valid request (서버로부터 오류 띄웠을 때)
     */
  });
};

/* ------------------------------ login 처리 호출 ------------------------------ */
exports.login = function(req, res) {
  var message = "";
  const userid = req.body.userid;
  const password = req.body.password;

  if (req.method == "POST") {
    db.query('SELECT ?? FROM ?? WHERE user_id = ?', [['user_id', 'password'], 'member', userid], function(err, results, fields) {
      if (err) throw err;
      if (results.length > 0) {
        bcrypt.compare(password, results[0].password, function(err, result) {
          if (result === true) {
            req.session.loggedin = true;
            req.session.user_id = results[0].user_id;
            res.redirect('/home');
          } else {
            message = "잘못된 아이디 또는 비밀번호!";
            res.render('login.ejs', { message: message, statusCode: 400 });
          }
        });
      } else {
        message = "잘못된 아이디 또는 비밀번호!";
        res.render('login.ejs', { message: message, statusCode: 400 });
      }
    });

  } else {
    res.render('login.ejs', {
      message: message,
      statusCode: 100
    });
  }

};

/* ------------------------------ logout 처리 호출 ------------------------------ */
exports.logout = function(req, res) {
  req.session.destroy(function(err) {
    res.redirect("/login");
  })
};

/* ------------------------------ profile 정보수정 처리 호출 ------------------------------ */
exports.saveChanges = function(req, res) {
  var user_id = req.session.user_id;
  var pw = req.body.password;
  var new_pw = req.body.new_password;
  var new_pw_c = req.body.new_password_confirm;
  var inputYear = req.body.yy;
  var inputMonth = req.body.mm;
  var inputDate = req.body.dd;

  if (req.method == "POST") {
    // 최대 해당 월의 일 설정
    if (month30.includes(inputMonth))
      maxDate = 30;
    else if (inputMonth == 2 )
      maxDate = 29;
    else
      maxDate = 31;

    db.query('SELECT ?? FROM ?? WHERE user_id = ?', [['password'], 'member', user_id], function(err, results, fields) {
      if (err) throw err;
      bcrypt.compare(pw, results[0].password, function(err, result) {
        if (result === false || new_pw !== new_pw_c) {
          req.session.message = "비밀번호가 일치하지 않습니다."
          res.redirect("/account/profile");
        } else if (inputYear <= minYear || inputYear > currentYear || inputMonth == "" || inputDate <= 0 || inputDate > maxDate) {
          req.session.message = "생년월일을 제대로 입력하세요!"
          res.redirect("/account/profile");
        } else {
          if (new_pw) {
            bcrypt.hash(new_pw, saltRounds, function(err, hash) {
              var post = {
                fullname: req.body.fullname,
                password: hash,
                gender: req.body.gender,
                birth: req.body.yy + "-" + req.body.mm + "-" + req.body.dd,
                email: req.body.email,
                phone: req.body.no_tel
              }

              db.query('UPDATE member SET fullname = ?, password = ?, gender = ?, birth = ?, email = ?, phone = ? WHERE user_id = ?', [post.fullname, post.password, post.gender, post.birth, post.email, post.phone, user_id], function (error, results, fields) {
                if (error) throw error;
                req.session.message = "변경이 저장되었습니다.";
                res.redirect("/account/profile");
              });
            });
          } else {
            var post = {
              fullname: req.body.fullname,
              gender: req.body.gender,
              birth: inputYear + "-" + inputMonth + "-" + inputDate,
              email: req.body.email,
              phone: req.body.no_tel
            }

            db.query('UPDATE member SET fullname = ?, gender = ?, birth = ?, email = ?, phone = ? WHERE user_id = ?', [post.fullname, post.gender, post.birth, post.email, post.phone, user_id], function (error, results, fields) {
              if (error) throw error;
              req.session.message = "변경이 저장되었습니다.";
              res.redirect("/account/profile");
            });
          }
        }
      });
    });
  }
};

/* ------------------------------ account 루트 처리 호출 ------------------------------ */
exports.openSubPage = function(req, res) {
  var reqSubPage = req.params.subPage;
  var reqShopId = req.params.shopId;
  var user_id = req.session.user_id;

  // 로그인된 상태 아니면 로그인 페이지로 이동
  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    if(reqSubPage === "profile") {
      // 로그인된 아이디의 해당 정보들을 가져오고 profile 페이지로 넘겨줌
      db.query('SELECT * FROM ?? WHERE user_id = ?', ['member', user_id], function(err, results, fields) {
        res.render('profile.ejs', {
          user_id: user_id,
          data: results,
          message: req.session.message,
          noOfCartItems: req.session.noOfCartItems,
          noOfWishlistItems: req.session.noOfWishlistItems,
        });
      });
    } else if (reqSubPage === "manage-address") {
      db.query('SELECT * FROM ?? WHERE user_id = ?', ['member', user_id], function(err, results, fields) {
        res.render('addresses.ejs', {
          user_id: user_id,
          data: results,
          message: req.session.message,
          noOfCartItems: req.session.noOfCartItems,
          noOfWishlistItems: req.session.noOfWishlistItems,
        });
      });
    } else if (reqSubPage === "purchase-history") {
      db.query('SELECT * FROM ?? WHERE user_id = ?', ['member', user_id], function(err, results, fields) {
        res.render('purchases.ejs', {
          user_id: user_id,
          data: results,
          message: req.session.message,
          noOfCartItems: req.session.noOfCartItems,
          noOfWishlistItems: req.session.noOfWishlistItems,
        });
      });
    } else if (reqSubPage === "payment-method") {
      db.query('SELECT * FROM ?? WHERE user_id = ?', ['member', user_id], function(err, results, fields) {
        res.render('paymeth.ejs', {
          user_id: user_id,
          data: results,
          message: req.session.message,
          noOfCartItems: req.session.noOfCartItems,
          noOfWishlistItems: req.session.noOfWishlistItems,
        });
      });
    } else if (reqSubPage === "seller-management") {
      var sql = `SELECT * FROM seller WHERE seller_id = ?;
                 SELECT * FROM product WHERE seller_id = ?;
                 SELECT * FROM shop WHERE seller_id = ?;
                 SELECT st.product_id, pr.product, pr.type_avail, st.shop_id, st.quantity, sh.shop
                 FROM stock as st
                    RIGHT OUTER JOIN shop as sh ON st.shop_id = sh.shop_id
                    RIGHT OUTER JOIN product as pr ON st.product_id = pr.product_id
                 WHERE st.seller_id = ? AND st.shop_id = ?; `
      var params = [user_id, user_id, user_id, user_id];

      if (req.session.selectedShop) {
        params.push(req.session.selectedShop);
      } else {
        params.push(0);
      }

      if (req.session.openProductInfo == null) {
        req.session.openProductInfo = { product_id: "", product: "", type_avail: "", info: "", price: "",
                                        discount: "", seller_id: "", rating: "", category: "", qrcode: "" };
      }

      if (req.session.openShopInfo == null) {
        req.session.openShopInfo = { shop_id: "", shop: "", address: "", phone: "", email: "", seller_id: ""};
      }

      db.query(sql, params, function(err, results, fields) {
        if (results[0].length > 0) {
          res.render('seller.ejs', {
            user_id: user_id,
            noOfCartItems: req.session.noOfCartItems,
            noOfWishlistItems: req.session.noOfWishlistItems,
            isSeller: "yes",
            seller: results[0][0],
            products: results[1],
            shops: results[2],
            stocks: results[3],
            formatNum: fn.formatNum,
            sess: req.session
          });
        } else {
          var emptySeller = { name: "", address: "", phone: "", email: "" };

          res.render('seller.ejs', {
            user_id: user_id,
            noOfCartItems: req.session.noOfCartItems,
            noOfWishlistItems: req.session.noOfWishlistItems,
            isSeller: "no",
            seller: emptySeller,
            sess: req.session
          });
        }
      });
    }
  }
}
