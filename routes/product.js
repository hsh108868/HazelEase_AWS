exports.showDetails = function(req, res) {
  const user_id = req.session.user_id;
  const reqProductId = req.params.productId;

  db.query('SELECT * FROM ?? WHERE product_id = ?', ['product', reqProductId], function(err, results, fields) {
    if (err) throw err;
    if (results.length > 0) { // 제품 아이디가 존재하는 경우
      res.render('product.ejs', { user_id: user_id, data: results });
    } else { // 제품 아이디가 없는 경우
      req.session.message = "요청한 제품의 정보가 없습니다.";
      res.render('product.ejs', { user_id: user_id, message: req.session.message});
    }
  });
};

/* ------------------------------ home화면 product 출력 ------------------------------ */


exports.showOutlines = function (req, res) {
  const user_id = req.session.user_id;
  db.query('select * from product;', function (err, results, fields) {
    if(err) throw err;
    res.render('home.ejs', {user_id : user_id, product : results});
  });
};

/* ------------------------------ 장바구니 추가 처리 ------------------------------ */


exports.cart = function (req, res) {
  const user_id = req.session.user_id;
  let reqProductId = req.params.productId;
  var now = new Date();

  var sql = 'insert into cart(user_id, product_id, date, quantity) values (?,?,?,?);';
  var params = [user_id, reqProductId, now, '1'];
  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    db.query(sql, params, function (err, results) {
      if (err) { res.send('send error');
        throw err;
      } else {
        console.log(results);
      }
      res.redirect('/my-cart');
    })
  }
}
/* 오류 발생시 product auto_increment 초기화
   alter table cart auto_increment=1;
 */

/* ------------------------------ 장바구니 출력 ------------------------------ */

exports.showMycart = function (req, res) {
  var user_id = req.session.user_id;
  db.query('select a.product, a.cost, a.review from product as a right outer join cart as b on a.product_id = b.product_id;',
      function (err, results, fields) {
        if(err) throw err;
        res.render('cart.ejs', { user_id: user_id, data : results });
  });
  };

  /* ------------------------------ wishlist 추가 처리 ------------------------------ */

  exports.wishlist = function (req, res) {
    const user_id = req.session.user_id;
    let reqProductId = req.params.productId;
    var now = new Date();

    var sql = 'insert into wishlist(user_id, product_id, date) values (?,?,?);';
    var params = [user_id, reqProductId, now];
    if (!req.session.loggedin) {
      res.redirect("/login");
      res.end();
    } else {
      db.query(sql, params, function (err, results) {
        if (err) {
          res.send('send error');
          throw err;
        } else {
          console.log(results);
        }
        res.redirect('/my-wishlist');
      })
    }
  }
  /* 오류 발생시 product auto_increment 초기화
     alter table wishlist auto_increment=1;
   */

  /* ------------------------------ wishlist 출력 ------------------------------ */

exports.showMyWishlist = function (req, res) {
  const user_id = req.session.user_id;
  db.query('select a.product, a.cost, a.review from product as a right outer join wishlist as b on a.product_id = b.product_id;', function (err, results, fields) {
    if(err) throw err;
    res.render('wishlist.ejs', { user_id: user_id, data : results });
  });
};
