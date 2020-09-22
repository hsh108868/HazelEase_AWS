const fn = require("../lib/other"); // 정의된 함수들 가져오기

/* ------------------------------ cart에 있는 제품 출력 ------------------------------ */
exports.show = function(req, res) {
  var user_id = req.session.user_id;

  if (!req.session.loggedin) {
    req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
    res.redirect("/login");
    res.end();
  } else {
    sql = `SELECT p.product_id, p.product, p.price, p.discount, p.rating, p.seller_id as seller,
                  c.cart_id, c.quantity, c.type, c.shop_id, c.checked,
                  s.shop
           FROM product AS p
              RIGHT OUTER JOIN cart AS c ON p.product_id = c.product_id
              RIGHT OUTER JOIN shop AS s ON c.shop_id = s.shop_id
           WHERE c.user_id = ?
           ORDER BY seller ASC;

           SELECT p.seller_id as seller, s.name as sellername, COUNT(*) as count
           FROM product as p
              RIGHT OUTER JOIN cart as c ON p.product_id = c.product_id
              RIGHT OUTER JOIN seller as s ON p.seller_id = s.seller_id
           WHERE c.user_id = ?
           GROUP BY seller
           ORDER BY seller ASC;

           SELECT checked, COUNT(*) as count
           FROM cart
           WHERE user_id = ? AND checked = 1
           GROUP BY checked;

           SELECT a.address_id, a.recipient, a.address, a.state, a.city, a.zip, a.phone, m.default_address
           FROM address as a
              RIGHT OUTER JOIN member as m ON a.address_id = m.default_address
           WHERE m.user_id = ?;

           SELECT * FROM image;

           SELECT s_money FROM member WHERE user_id = ?;`

    params = [user_id, user_id, user_id, user_id, user_id];

    db.query(sql, params, function(err, results, fields) {
      if (err) throw err;
      req.session.noOfCartItems = results[0].length;
      req.session.noOfCheckedItems = results[2].length > 0 ? results[2][0].count : 0;
      res.render('cart.ejs', {
        user_id: user_id,
        data: results[0],
        rep: results[1],
        address: results[3],
        images: results[4],
        hazelMoney: results[5][0].s_money,
        formatNum: fn.formatNum,
        couponResult: [req.session.couponCode, req.session.couponValue, req.session.couponMsg, req.session.couponStatus],
        sess: req.session
      });
    });
  }
};

/* ------------------------------ cart에 항목 추가 처리 ------------------------------ */
exports.add = function(req, res) {
  const user_id = req.session.user_id;
  let reqProductId = req.params.productId;
  let reqType = req.body.type;
  let reqQuantity = eval(req.body.quantity);
  let reqShopId = req.body.shopId;
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
    db.query(sql, params, function(err, results) {
      let listOfType = results[0].type_avail.split('/');
      let listOfQty = results[0].quantity.split(',');
      let index = listOfType.indexOf(reqType);

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
  }
}
/* 오류 발생시 product auto_increment 초기화
 * alter table cart auto_increment=1;
 */

/* ------------------------------ cart에세 항목 삭제 처리 ------------------------------ */
exports.delete = function(req, res) {
  req.session.couponCode = "";
  req.session.couponValue = "";
  req.session.couponMsg = "";
  req.session.couponStatus = 0;

  var reqCartId = req.params.cartId;

  var sql = 'delete from cart where cart_id=?;';
  var params = [reqCartId];
  if (!req.session.loggedin) {
    req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
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
      req.session.backURL = req.header('Referer') || '/';
      res.redirect(req.session.backURL);
    })
  }
}

/* ------------------------------ cart에서 수량, 체크상태 업데이트 처리 ------------------------------ */
exports.update = function(req, res) {
  req.session.couponCode = "";
  req.session.couponValue = "";
  req.session.couponMsg = "";
  req.session.couponStatus = 0;

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

    if (eval(refVarQty) == "" || eval(refVarQty) == "0") {
      refVarQty = '1';
    }

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
    req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
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

/* ------------------------------ cart에 쿠폰코드 적용 처리 ------------------------------ */
exports.applyCoupon = function(req, res) {
  var couponInput = req.body.code;
  var subTotal = req.body.subTotal;
  var sess = req.session;

  var today = new Date().getTime();

  db.query('SELECT * FROM coupon WHERE coupon_code = ?', [couponInput], function(err, results, fields) {
    if (results.length > 0) {
      cond1 = today < results[0].effective_date.getTime();
      cond2 = today > results[0].expiry_date.getTime();
      cond3 = subTotal < results[0].min_spend;
      if (cond1 || cond2 || cond3) {
        if (cond1)
          sess.couponMsg = "쿠폰 유효기간이 아닙니다.";
        else if (cond2)
          sess.couponMsg = "쿠폰 유효기간이 끝났습니다.";
        else if (cond3)
          sess.couponMsg = "구매금액이 " + fn.formatNum(results[0].min_spend) + "원 이상일 때 사용할 수 있습니다.";

        sess.couponCode = "";
        sess.couponValue = "";
        sess.couponStatus = 0;
      } else {
        sess.couponMsg = "'" + results[0].coupon_code + "' 쿠폰코드가 적용되었습니다.";
        sess.couponCode = results[0].coupon_code;
        sess.couponValue = results[0].value;
        sess.couponStatus = 1;
      }
    } else {
      sess.couponMsg = "쿠폰 코드가 존재하지 않습니다.";
      sess.couponCode = "";
      sess.couponValue = "";
      sess.couponStatus = 0;
    }
    res.redirect("/my-cart");
  });
};

/* ------------------------------ 결제 처리 ------------------------------ */
exports.processPayment = function(req, res) {
  var user_id = req.session.user_id;
  const now = new Date();
  let trans_id = (Math.round(new Date().valueOf() + Math.random() * 100)).toString().slice(3);
  let order_id = (Math.round(new Date().valueOf() + Math.random() * 100)).toString().slice(3);

  let hazelMoney = parseInt(req.body.hazelMoney, 10);
  let totalDisc = parseInt(req.body.totalDiscount, 10);
  let total = parseInt(req.body.total, 10);
  let coupon = [req.body.couponCode, req.body.couponValue];
  let recipient = req.body.recipient;
  let address = req.body.address;
  let phone = req.body.phone;

  var transPost = {
    trans_id: trans_id,
    user_id: user_id,
    total_discount: totalDisc,
    total_paid: total,
    coupon_code: coupon[0],
    coupon_value: coupon[1],
    recipient: recipient,
    address: address,
    contact: phone,
    date: now
  }

  if (!req.session.loggedin) {
    req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
    res.redirect("/login");
    res.end();
  } else {
      if (hazelMoney < total) {
        sess.messageErr = "하젤페이 머니가 부족합니다.";
        res.redirect("/my-cart");
      } else {
        db.query(`INSERT INTO transaction SET ?;`, transPost, function(errA, resultsA, fieldsA) {
          if (errA) throw errA;
          let sql = `SELECT *
                     FROM cart as c
                        INNER JOIN product as p ON c.product_id = p.product_id
                     WHERE checked = ? AND user_id = ?
                     ORDER BY p.seller_id ASC;

                     SELECT s.seller_id, COUNT(*) as count
                     FROM cart as c
                        INNER JOIN shop as s ON c.shop_id = s.shop_id
                     WHERE user_id = ?
                     GROUP BY s.seller_id
                     ORDER BY s.seller_id ASC; `
          let params = [1, user_id, user_id];
          db.query(sql, params, function(errB, resultsB, fieldsB) {
            if (errB) throw errB;
            sql = `INSERT INTO orders (trans_id, order_id, seller_id, product_id, type, price, quantity, subtotal, shop_id, user_id, status, latest_update)
                   VALUES `;
            params = [];

            let p = 0;
            let q = resultsB[1][p].count;
            let limit = resultsB[1].length;

            for(i = 0; i < resultsB[0].length; i++) {
              if(i == q) {
                order_id = (Math.round(new Date().valueOf() + Math.random() * 100)).toString().slice(3);
                if (++p < limit) {
                  q += resultsB[1][p].count;
                }
              }

              let r = resultsB[0][i];
              sql += `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              params.push(trans_id, order_id, r.seller_id, r.product_id, r.type, r.price, r.quantity, r.price * r.quantity, r.shop_id, user_id, 'waiting', now);

              if (i != resultsB[0].length - 1) {
                sql += `, `
              } else {
                sql += `; `
              }
            }

            sql += `DELETE FROM cart WHERE checked = ? AND user_id = ?;
                    UPDATE member SET s_money = ? WHERE user_id = ?; `
            params.push(1, user_id, (hazelMoney - total), user_id);

            db.query(sql, params, function(errC, resultsC, fieldsC) {
              if (errC) throw errC;
              res.redirect("/my-notification");
            });
          });
        })
      }
  }
}
