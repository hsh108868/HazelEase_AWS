const fn = require("../lib/other"); // 정의된 함수들 가져오기

/* ------------------------------ home화면 product 출력 ------------------------------ */
exports.showOutlines = function(req, res) {
  req.session.couponCode = "";
  req.session.couponValue = "";
  req.session.couponMsg = "";
  req.session.couponStatus = 0;

  // 판매자 관리 시스템 열리는 폼 설정
  req.session.openForm = 0;

  const user_id = req.session.user_id;
  sql = `SELECT * FROM product;
         SELECT user_id, COUNT(*) as count FROM cart WHERE user_id = ? GROUP BY user_id;
         SELECT user_id, COUNT(*) as count FROM wishlist WHERE user_id = ? GROUP BY user_id;
         SELECT * FROM image;`
  params = [user_id, user_id];

  db.query(sql, params, function(err, results, fields) {
    if (err) throw err;
    req.session.noOfCartItems = results[1].length > 0 ? results[1][0].count : 0;
    req.session.noOfWishlistItems = results[2].length > 0 ? results[2][0].count : 0;

    res.render('home.ejs', {
      user_id: user_id,
      product: results[0],
      images: results[3],
      formatNum: fn.formatNum,
      sess: req.session
    });
  });
};


/* ------------------------------ product의 상세정보 출력 ------------------------------ */
exports.showDetails = function(req, res) {
  const user_id = req.session.user_id;
  const reqProductId = req.params.productId;

  sql = `SELECT p.*, s.name as seller
         FROM product as p RIGHT OUTER JOIN seller as s ON p.seller_id = s.seller_id
         WHERE product_id = ?;

         SELECT * FROM image WHERE product_id = ?;
         SELECT * FROM wishlist WHERE product_id = ? AND user_id = ?;
         SELECT user_id, COUNT(*) as count FROM cart WHERE user_id = ? GROUP BY user_id;
         SELECT user_id, COUNT(*) as count FROM wishlist WHERE user_id = ? GROUP BY user_id;

         SELECT *
         FROM stock as st RIGHT OUTER JOIN shop as sh ON st.shop_id = sh.shop_id
         WHERE product_id = ?;`
  params = [reqProductId, reqProductId, reqProductId, user_id, user_id, user_id, reqProductId];
  db.query(sql, params, function(err, results, fields) {
    if (err) throw err;
    req.session.noOfCartItems = results[3].length > 0 ? results[3][0].count : 0;
    req.session.noOfWishlistItems = results[4].length > 0 ? results[4][0].count : 0;

    var typeAvailable = results[0][0].type_avail.split('/');

    if (results[0].length > 0) { // 제품 아이디가 존재하는 경우
      res.render('product.ejs', {
        user_id: user_id,
        data: results[0][0],
        images: results[1],
        wishlisted: results[2].length,
        stock: results[5],
        typeAvailable: typeAvailable,
        sess: req.session,
        formatNum: fn.formatNum
      });
    } else { // 제품 아이디가 없는 경우
      res.redirect("/");
    }
  });
};
