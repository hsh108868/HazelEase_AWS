const fn = require("../lib/other"); // 정의된 함수들 가져오기

/* ------------------------------ QR코드 페이지 렌더 ------------------------------ */
exports.openPage = function(req, res) {
  const user_id = req.session.user_id;
  res.render('qrscan.ejs', {
    user_id: user_id,
    sess: req.session
  });
}

exports.openErrorPage = function (req, res) {
  const user_id = req.session.user_id;
  let reqErrStatus = req.params.errStatus;

  if(reqErrStatus == 404) {
    req.session.errMessage = "제품이 존재하지 않습니다."
  } else if (reqErrStatus == 403) {
    req.session.errMessage = "관련 데이터를 변경할 수 있는 권한이 없습니다."
  }

  req.session.errStatus = reqErrStatus;

  res.render('qrscan.ejs', {
    user_id: user_id,
    sess: req.session
  });
}

/* ------------------------------ 출력곳 설정 처리 ------------------------------ */
exports.outputLocation = function(req, res) {
  let reqOutputLocation = req.params.outputLocation;
  req.session.outputLocation = reqOutputLocation;

  res.redirect('/qrcode');
}

/* ------------------------------ QR코드로 항목 추가 처리 ------------------------------ */
exports.addProduct = function(req, res) {
  const user_id = req.session.user_id;
  let reqProductId = req.params.productId;
  let reqType = req.params.type;
  let reqQuantity = 1;
  let reqShopId = req.params.shopId;
  let outputLocation = req.session.outputLocation;
  var now = new Date();

  var sql = `SELECT p.type_avail, s.quantity
               FROM stock as s
                  RIGHT OUTER JOIN product as p ON s.product_id = p.product_id
               WHERE s.product_id = ? AND s.shop_id = ?; `
  var params = [reqProductId, reqShopId];

  if (!req.session.loggedin) {
    req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
    res.redirect("/login");
    res.end();
  } else {
    if (outputLocation == null || outputLocation == 'cart') {
      outputLocation = 'cart'; req.session.outputLocation = 'cart';

      db.query(sql, params, function(err, results) {
        if (err) throw err;

        if (results.length == 0) {
          res.redirect('/qrcode-error-404');
          return;
        }

        let listOfType = results[0].type_avail.split('/');
        let listOfQty = results[0].quantity.split(',');
        let index = listOfType.indexOf(reqType);

        if (index < 0) {
          res.redirect('/qrcode-error-404');
          return;
        }

        if (listOfQty[index] == 0) {
          req.session.message = "원하는 종류가 선택한 매장에 품절되었습니다."
          res.redirect('/product/' + reqProductId);
          return;
        } else if (reqQuantity > listOfQty[index]) {
          req.session.message = "요청한 수량이 매장에 있는 수량보다 많습니다."
          res.redirect('/product/' + reqProductId);
          return;
        }

        sql = 'SELECT * FROM cart WHERE product_id = ? AND type = ? AND shop_id = ? AND user_id = ?'
        params = [reqProductId, reqType, reqShopId, user_id];
        db.query(sql, params, function(err, resultsA) {
          if (err) {
            res.send('쇼핑카트 항목 추가에 실패');
            throw err;
          } else if (resultsA.length == 0) {
            sql = 'INSERT INTO cart(user_id, product_id, type, shop_id, quantity, date, checked) values (?,?,?,?,?,?,?);';
            params = [user_id, reqProductId, reqType, reqShopId, reqQuantity, now, '1'];
            db.query(sql, params, function(err, resultsB) {
              if (err) throw err;
              res.redirect('/my-cart');
            });
          } else {
            var qty = eval(resultsA[0].quantity) + reqQuantity;

            if (listOfQty[index] == 0) {
              req.session.message = "원하는 종류가 선택한 매장에 품절되었습니다."
              res.redirect('/product/' + reqProductId);
              return;
            } else if (qty > listOfQty[index]) {
              req.session.message = "카트에 이미 담은 수량과 합해서 수량이 매장에 있는 수량보다 많습니다."
              res.redirect('/product/' + reqProductId);
              return;
            }

            sql = 'UPDATE cart SET quantity = ?, checked = ? WHERE cart_id = ?;'
            params = [qty, 1, resultsA[0].cart_id];
            db.query(sql, params, function(err, resultsB) {
              if (err) throw err;
              res.redirect('/my-cart');
            });
          }
        });
      });
    } else if (outputLocation == 'wishlist') {
      db.query(sql, params, function(err, results) {
        if (err) throw err;

        if (results.length == 0) {
          res.redirect('/qrcode-error-404');
          return;
        }

        let listOfType = results[0].type_avail.split('/');
        let typeExist = listOfType.includes(reqType);

        if (typeExist) {
          db.query('SELECT product_id FROM wishlist WHERE product_id = ? AND type = ? AND shop_id = ? AND user_id = ?', [reqProductId, reqType, reqShopId, user_id], function(err, results) {
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
            res.redirect('/my-wishlist');
          });
        } else {
          res.redirect('/qrcode-error-404');
        }
    });
  }
  }
}

/* ------------------------------ QR코드로 픽업완료 처리 ------------------------------ */
exports.completePickup = function(req, res) {
  var user_id = req.session.user_id;
  var reqTransId = req.params.transId;
  var reqOrderId = req.params.orderId;
  var reqShopId = req.params.shopId;
  var now = new Date();
  let sql, params;

  if (!req.session.loggedin) {
      req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
      res.redirect("/login");
      res.end();
  } else {
      sql = `SELECT * FROM orders WHERE seller_id = ? AND trans_id = ? AND order_id = ? AND shop_id = ? AND status = 'pickup'; `
      params = [user_id, reqTransId, reqOrderId, reqShopId];

      db.query(sql, params, function (errA, resultsA) {
        if (errA) throw errA;

        if (resultsA.length > 0) {
          sql = `UPDATE orders SET status = 'completed', latest_update = ? WHERE trans_id = ? AND order_id = ? AND shop_id = ? AND status = 'pickup'; `
          params = [now, reqTransId, reqOrderId, reqShopId];
          db.query(sql, params, function (err, results) {
              if (err) throw err;
              req.session.message = "픽업승인 완료되었습니다. (주문번호 " + reqOrderId + ")";
              res.redirect('/account/seller-management');
          });
        } else {
          res.redirect('/qrcode-error-403');
          return;
        }
      });
  }
}
