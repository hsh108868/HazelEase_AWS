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
        message: message
      });
    } else { // 제품 아이디가 없는 경우
      message = "요청한 제품의 정보가 없습니다.";
      res.render('product.ejs', {
        user_id: user_id,
        message: message
      });
    }
  });
};

/* ------------------------------ home화면 product 출력 ------------------------------ */
exports.showOutlines = function(req, res) {
  const user_id = req.session.user_id;
  sql = `SELECT * FROM product;`
  db.query(sql, function(err, results, fields) {
    if (err) throw err;
    res.render('home.ejs', {
      user_id: user_id,
      product: results,
      formatNum: fn.formatNum
    });
  });
};

/* ------------------------------ cart에 있는 제품 출력 ------------------------------ */
exports.showMyCart = function(req, res) {
  var user_id = req.session.user_id;

  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    sql = `SELECT p.product, p.price, p.rating, p.type_avail, p.user_id as seller, c.cart_id, c.quantity, c.user_id, c.checked
           FROM product AS p RIGHT OUTER JOIN cart AS c
           ON p.product_id = c.product_id
           WHERE c.user_id = ?
           ORDER BY seller ASC;

           SELECT p.user_id as seller, COUNT(*) as count
           FROM product as p RIGHT OUTER JOIN cart as c
           ON p.product_id = c.product_id
           WHERE c.user_id = ?
           GROUP BY seller
           ORDER BY seller ASC;

           SELECT checked, COUNT(*) as count
           FROM cart
           WHERE user_id = ? AND checked = 1
           GROUP BY checked`
    params = [user_id, user_id, user_id];
    db.query(sql, params, function(err, results, fields) {
      if (err) throw err;
      console.log(results[2]);
      res.render('cart.ejs', {
        user_id: user_id,
        data: results[0],
        rep: results[1],
        noOfCheckedItems: results[2].length > 0 ? results[2][0].count : 0,
        formatNum: fn.formatNum
      });
    });
  }
};

/* ------------------------------ cart에 항목 추가 처리 ------------------------------ */
exports.cartAdd = function(req, res) {
  const user_id = req.session.user_id;
  let reqProductId = req.params.productId;
  var now = new Date();

  var sql = 'insert into cart(user_id, product_id, date, quantity, checked) values (?,?,?,?,?);';
  var params = [user_id, reqProductId, now, '1', '1'];
  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    db.query(sql, params, function(err, results) {
      if (err) {
        res.send('쇼핑카트 항목 추가에 실패');
        throw err;
      } else {
        console.log("성공적으로 추가되었습니다.");
      }
      res.redirect('/my-cart');
    })
  }
}
/* 오류 발생시 product auto_increment 초기화
 * alter table cart auto_increment=1;
 */

/* ------------------------------ cart에세 항목 삭제 처리 ------------------------------ */
exports.cartDelete = function(req, res) {
  var reqCartId = req.params.cartId;

  var sql = 'delete from cart where cart_id=?;';
  var params = [reqCartId];
  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    db.query(sql, params, function(err, results) {
      if (err) {
        res.send('쇼핑카트에 항목 삭제에 실패');
        throw err;
      } else {
        console.log("성공적으로 삭제되었습니다.");
      }
      res.redirect('/my-cart');
    })
  }
}

/* ------------------------------ cart에서 수량, 체크상태 업데이트 처리 ------------------------------ */
exports.cartUpdate = function(req, res) {
  var reqTotalItems = req.params.totalItems;
  var cartIds = [];
  var qtyValues = [];
  var cbCond = [];

  var sql = "";
  var params = [];

  for (let i = 0; i < reqTotalItems; i++) {
    refVarCart = "req.body.cart" + i.toString();
    refVarQty = "req.body.qty" + i.toString();
    refVarCb = "req.body.cb" + i.toString();
    cartIds.push(eval(refVarCart));
    qtyValues.push(eval(refVarQty));
    cbCond.push(eval(refVarCb));
    sql = sql + 'UPDATE cart SET quantity = ?, checked = ? WHERE cart_id = ?; ';
  }

  for (let i = 0; i < reqTotalItems; i++) {
    params.push(qtyValues[i]);
    params.push(cbCond[i]);
    params.push(cartIds[i]);
  }

  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    db.query(sql, params, function(err, results) {
      if (err) {
        res.send('쇼핑카트에 수량 업데이트에 실패');
        throw err;
      } else {
        console.log("성공적으로 업데이트되었습니다.");
      }
      res.redirect('/my-cart');
    })
  }
}

/* ------------------------------ wishlist에 있는 제품 출력 ------------------------------ */
exports.showMyWishlist = function(req, res) {
  const user_id = req.session.user_id;

  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    db.query('select a.product_id, a.product, a.price, a.rating, b.wishlist_id, b.user_id from product as a right outer join wishlist as b on a.product_id = b.product_id where b.user_id = ?',
      [user_id],
      function(err, results, fields) {
        if (err) throw err;
        res.render('wishlist.ejs', {
          user_id: user_id,
          data: results,
          formatNum: fn.formatNum
        });
      });
  }
};

/* ------------------------------ wishlist에 항목 추가 처리 ------------------------------ */
exports.wishlistAdd = function(req, res) {
  const user_id = req.session.user_id;
  let reqProductId = req.params.productId;
  var now = new Date();

  var sql = 'insert into wishlist(user_id, product_id, date) values (?,?,?);';
  var params = [user_id, reqProductId, now];
  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    db.query(sql, params, function(err, results) {
      if (err) {
        res.send('실패');
        throw err;
      }
      res.redirect('/my-wishlist');
    })
  }
}
/* 오류 발생시 product auto_increment 초기화
   alter table wishlist auto_increment=1;
 */

/* ------------------------------ wishlist에세 항목 삭제 처리 ------------------------------ */
exports.wishlistDelete = function(req, res) {
  var reqWishlistId = req.params.wishlistId;

  var sql = 'delete from wishlist where wishlist_id=?;';
  var params = [reqWishlistId];
  if (!req.session.loggedin) {
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
      res.redirect('/my-wishlist');
    })
  }
}

/* ------------------------------ wishlist에서 cart로 담기 처리 ------------------------------ */
exports.wishlistMove = function(req, res) {
  const user_id = req.session.user_id;
  let reqWishlistId = req.params.wishlistId;
  let reqProductId = req.params.productId;
  var now = new Date();

  var productId = 0;

  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    var sql = `SELECT product_id FROM wishlist WHERE wishlist_id = ?;
               INSERT INTO cart(user_id, product_id, date, quantity) values (?, ?, ?, ?);
               DELETE FROM wishlist WHERE wishlist_id = ?;`
    var params = [reqWishlistId, user_id, reqProductId, now, 1, reqWishlistId];
    db.query(sql, params, function(err, results) {
      if (err) {
        console.log('쇼핑카트 담기에 실패');
        throw err;
      }
      res.redirect('/my-wishlist');
    });
  }
}
