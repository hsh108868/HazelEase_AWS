const fn = require("../lib/other"); // 정의된 함수들 가져오기

/* ------------------------------ wishlist에 있는 제품 출력 ------------------------------ */
exports.show = function(req, res) {
  const user_id = req.session.user_id;

  if (!req.session.loggedin) {
    req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
    res.redirect("/login");
    res.end();
  } else {
    sql = `SELECT w.wishlist_id, w.product_id, p.product, w.type, p.price, p.rating, w.shop_id, s.shop
           FROM wishlist as w
              RIGHT OUTER JOIN product as p on w.product_id = p.product_id
              RIGHT OUTER JOIN shop as s on w.shop_id = s.shop_id
           WHERE w.user_id = ?;

           SELECT w.wishlist_id, w.product_id, p.product, p.price, p.rating
           FROM wishlist as w
              RIGHT OUTER JOIN product as p on w.product_id = p.product_id
           WHERE w.user_id = ? AND (shop_id IS NULL OR type IS NULL);

           SELECT * FROM image;`
    db.query(sql, [user_id, user_id], function(err, results, fields) {
        if (err) throw err;
        req.session.noOfWishlistItems = results[0].length + results[1].length;

        for (let i = 0; i < results[1].length; i++) {
          results[0].push(results[1][i]);
        }

        res.render('wishlist.ejs', {
          user_id: user_id,
          data: results[0],
          images: results[2],
          formatNum: fn.formatNum,
          sess: req.session
        });
      });
  }
};

/* ------------------------------ wishlist에 항목 추가 처리 ------------------------------ */
exports.add = function(req, res) {
  const user_id = req.session.user_id;
  let reqProductId = req.params.productId;
  let reqType = req.params.type;
  let reqShopId = req.params.shopId;
  var now = new Date();

  if (!req.session.loggedin) {
    req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
    res.redirect("/login");
    res.end();
  } else {
    let sql, params;

    if (reqType == null || reqShopId == null) {
      sql = 'SELECT product_id FROM wishlist WHERE product_id = ? AND type IS NULL AND shop_id IS NULL AND user_id = ?';
      params = [reqProductId, user_id];
    } else {
      sql = 'SELECT product_id FROM wishlist WHERE product_id = ? AND type = ? AND shop_id = ? AND user_id = ?';
      params = [reqProductId, reqType, reqShopId, user_id];
    }

    db.query(sql, params, function(err, results) {
      if (err) throw err;
      if (results.length == 0) {
        var sql = 'INSERT INTO wishlist(user_id, product_id, type, shop_id, date) values (?,?,?,?,?);';
        var params = [user_id, reqProductId, reqType, reqShopId, now];
        db.query(sql, params, function(err, results) {
          if (err) {
            res.send('실패');
            throw err;
          }
        });
      }
      res.redirect('/product/' + reqProductId);
    });
  }
}
/* 오류 발생시 product auto_increment 초기화
   alter table wishlist auto_increment=1;
 */

/* ------------------------------ wishlist에세 항목 삭제 처리 ------------------------------ */
exports.delete = function(req, res) {
  const user_id = req.session.user_id;
  var reqWishlistId = req.params.wishlistId;
  var reqProductId = req.params.productId;

  var sql = 'DELETE FROM wishlist WHERE ';
  var params = [];
  if (reqWishlistId) {
    sql += 'wishlist_id = ?; '
    params = [reqWishlistId];
  } else {
    sql += 'product_id = ? AND type IS NULL AND shop_id IS NULL AND user_id = ?; '
    params = [reqProductId, user_id];
  }

  if (!req.session.loggedin) {
    req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
    res.redirect("/login");
    res.end();
  } else {
    db.query(sql, params, function(err, results) {
      if (err) {
        res.send('위시리스트 항목 삭제에 실패');
        throw err;
      } else {
        console.log("성공적으로 삭제되었습니다.");
      }

      if (reqWishlistId) {
        res.redirect('/my-wishlist');
      } else {
        res.redirect('/product/' + reqProductId);
      }
    })
  }
}

/* ------------------------------ wishlist에서 cart로 담기 처리 ------------------------------ */
exports.move = function(req, res) {
  const user_id = req.session.user_id;
  let reqWishlistId = req.params.wishlistId;
  let reqProductId = req.params.productId;
  let reqType = req.params.type;
  let reqShopId = req.params.shopId;
  var now = new Date();

  var productId = 0;

  if (!req.session.loggedin) {
    req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
    res.redirect("/login");
    res.end();
  } else {
    var sql = `DELETE FROM wishlist WHERE wishlist_id = ?;`
    var params = [reqWishlistId];
    db.query(sql, params, function(err, results) {
      if (err) {
        console.log('쇼핑카트 담기에 실패');
        throw err;
      }

      if(reqType == null || reqShopId == null) {
        req.session.notice = "종류와 매장을 선택하세요.";
        req.session.autoSubmit = 'no';
        res.redirect('/product/' + reqProductId);
      } else {
        req.session.selectType = reqType;
        req.session.selectShopId = reqShopId;
        req.session.autoSubmit = 'yes';
        res.redirect('/product/' + reqProductId);
      }
    });
  }
}
