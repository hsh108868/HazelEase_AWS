const fn = require("../lib/other"); // 정의된 함수들 가져오기

/* ------------------------------ product의 상세정보 출력 ------------------------------ */
exports.showDetails = function(req, res) {
  const user_id = req.session.user_id;
  var message = req.session.message;
  const reqProductId = req.params.productId;

  db.query('SELECT * FROM ?? WHERE product_id = ?', ['product', reqProductId], function(err, results, fields) {
    if (err) throw err;
    if (results.length > 0) { // 제품 아이디가 존재하는 경우
      message = "요청한 제품의 정보가 여기입니다.";
      res.render('product.ejs', {
        user_id: user_id,
        data: results,
        message: message,
        noOfCartItems: req.session.noOfCartItems,
        noOfWishlistItems: req.session.noOfWishlistItems,
        formatNum: fn.formatNum
      });
    } else { // 제품 아이디가 없는 경우
      message = "요청한 제품의 정보가 없습니다.";
      res.render('product.ejs', {
        user_id: user_id,
        message: message,
        noOfCartItems: req.session.noOfCartItems,
        noOfWishlistItems: req.session.noOfWishlistItems
      });
    }
  });
};

/* ------------------------------ home화면 product 출력 ------------------------------ */
exports.showOutlines = function(req, res) {
  req.session.couponCode = "";
  req.session.couponValue = "";
  req.session.couponMsg = "";
  req.session.couponStatus = 0;

  // 판매자 관리 시스템 열리는 폼 설정
  req.session.openForm = 0;

  const user_id = req.session.user_id;
  sql = "SELECT * FROM product; "
  sql += "SELECT user_id, COUNT(*) as count FROM cart WHERE user_id = ? GROUP BY user_id; "
  sql += "SELECT user_id, COUNT(*) as count FROM wishlist WHERE user_id = ? GROUP BY user_id; "
  params = [user_id, user_id];

  db.query(sql, params, function(err, results, fields) {
    if (err) throw err;
    req.session.noOfCartItems = results[1].length > 0 ? results[1][0].count : 0;
    req.session.noOfWishlistItems = results[2].length > 0 ? results[2][0].count : 0;

    res.render('home.ejs', {
      user_id: user_id,
      product: results[0],
      noOfCartItems: results[1].length > 0 ? results[1][0].count : "",
      noOfWishlistItems: results[2].length > 0 ? results[2][0].count : "",
      formatNum: fn.formatNum
    });
  });
};
