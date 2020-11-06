const fn = require("../lib/other"); // 정의된 함수들 가져오기

/* ------------------------------ notification 페이지에 출력 ------------------------------ */
exports.show = function (req, res) {
    var user_id = req.session.user_id;

    if (!req.session.loggedin) {
        req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
        res.redirect("/login");
        res.end();
    } else {
        sql = `SELECT o.trans_id, o.order_id, p.product_id, p.product, o.type, o.quantity, sh.shop_id, sh.shop, se.name as sellername
               FROM product as p
                  RIGHT OUTER JOIN orders as o ON p.product_id = o.product_id
                  RIGHT OUTER JOIN shop as sh ON sh.shop_id = o.shop_id
                  RIGHT OUTER JOIN seller as se ON se.seller_id = p.seller_id
               WHERE status = 'waiting' AND user_id = ?
               ORDER BY o.trans_id ASC, o.order_id ASC, p.seller_id ASC;

               SELECT trans_id, COUNT(*) as count
               FROM orders
               WHERE status = 'waiting' AND user_id = ?
               GROUP BY trans_id;

               SELECT o.trans_id, o.order_id, o.seller_id, s.name as sellername, COUNT(*) as count
               FROM orders as o
                  RIGHT OUTER JOIN seller as s ON s.seller_id = o.seller_id
               WHERE status = 'waiting' AND user_id = ?
               GROUP BY o.trans_id, o.order_id, o.seller_id;

               SELECT * FROM image;

               SELECT trans_id, date
               FROM transaction
               WHERE user_id = ?;

               SELECT * FROM orders WHERE user_id = ? AND (status = 'delivery' OR status = 'pickup');
               SELECT * FROM orders WHERE user_id = ? AND status = 'direct'; `

        params = [user_id, user_id, user_id, user_id, user_id, user_id];

        db.query(sql, params, function (err, results, fields) {
            if (err) throw err;
            req.session.noOfNotifications = results[1].length;
            req.session.noOfReceivingItems = results[5].length + (results[6].length > 0 ? 1 : 0);

            res.render('notification.ejs', {
                user_id: user_id,
                data: results[0],
                pendingTrans: results[1],
                pendingOrder: results[2],
                images: results[3],
                transaction: results[4],
                formatNum: fn.formatNum,
                sess: req.session
            });
        });
    }
}

/* ------------------------------ notification 수령법 선택 ------------------------------ */
exports.select = function (req, res) {
    var user_id = req.session.user_id;
    let reqReceiptMode = req.params.receiptMode;
    let reqOrderId = req.params.orderId;
    var now = new Date();
    var sql, params;

    if (!req.session.loggedin) {
        req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
        res.redirect("/login");
        res.end();
    } else {
        if (reqReceiptMode == 'delivery' || reqReceiptMode == 'pickup' || reqReceiptMode == 'waiting') {
            sql = `UPDATE orders SET status = ?, latest_update = ? WHERE user_id = ? AND order_id = ?; `
            params = [reqReceiptMode, now, user_id, reqOrderId];
        } else if (reqReceiptMode == 'direct') {
            sql = `UPDATE orders SET status = ?, latest_update = ? WHERE user_id = ? AND order_id = ?; `
            sql += `UPDATE orders SET status = 'waiting', latest_update = ? WHERE status = 'direct' AND user_id = ? AND NOT order_id = ?; `
            params = [reqReceiptMode, now, user_id, reqOrderId, now, user_id, reqOrderId];
        } else if (reqReceiptMode == 'cancel') {
          sql = `SELECT o.*, p.type_avail, s.quantity as stock_qty
                 FROM orders as o
                    RIGHT OUTER JOIN product as p ON p.product_id = o.product_id
                    RIGHT OUTER JOIN stock as s ON s.product_id = o.product_id AND s.shop_id = o.shop_id
                 WHERE o.user_id = ? AND o.order_id = ? AND status = 'waiting';

                 SELECT t.*
                 FROM transaction as t
                    RIGHT OUTER JOIN orders as o ON o.trans_id = t.trans_id
                 WHERE t.user_id = ? AND o.order_id = ?
                 GROUP BY t.trans_id;

                 SELECT s_money FROM member WHERE user_id = ?;`
          params = [user_id, reqOrderId, user_id, reqOrderId, user_id];
        }

        db.query(sql, params, function (err, results) {
            if (err) throw err;
            if (reqReceiptMode == 'cancel') {
              db.query(sql, params, function (err, results) {
                if (err) throw err;
                let totalRefund = 0;
                let transInfo = results[1][0];
                let hazelMoneyBal = results[2][0].s_money;
                let afterRefund, newQty;
                let qtyString = '';
                sql = '';
                params = [];

                for(let i = 0; i < results[0].length; i++) {
                  totalRefund += results[0][i].subtotal;

                  // 재고 관련
                  let types = results[0][i].type_avail.split('/');
                  let quantities = results[0][i].stock_qty.split(',');

                  if (quantities.length != types.length) {
                    for (let j = quantities.length; j < types.length; j++) {
                      quantities.push('0');
                    }
                  }

                  let index = results[0][i].type != "None" ? types.indexOf(results[0][i].type) : 0;

                  newQty = results[0][i].quantity + eval(quantities[index]);
                  quantities[index] = newQty.toString();

                  for (let i = 0; i < quantities.length; i++) {
                    qtyString += quantities[i].replace(/\s/g, '');
                    if (i != quantities.length - 1) {
                      qtyString += ', ';
                    }
                  }
                  sql += `UPDATE stock SET quantity = ? WHERE product_id = ? AND shop_id = ?; `
                  params.push(qtyString, results[0][i].product_id, results[0][i].shop_id);
                }

                // ---------- //

                if (results[1][0].coupon_value != 0) {
                  totalRefund -= results[1][0].coupon_value;
                }

                afterRefund = transInfo.total_paid - totalRefund;

                // 주문 삭제
                sql += `DELETE FROM orders WHERE order_id = ?; `
                params.push(reqOrderId);

                // 구매기록의 환불 후의 total_paid이 0이면 삭제, 아니면 구매기록 업데이트
                if (afterRefund === 0) {
                  sql += `DELETE FROM transaction WHERE trans_id = ?; `
                  params.push(transInfo.trans_id);
                } else {
                  sql += `UPDATE transaction SET total_paid = ?, coupon_code = NULL, coupon_value = 0 WHERE trans_id = ?;`
                  params.push(afterRefund, transInfo.trans_id);
                }

                // 사용자의 헤이즐머니 업데이트
                sql += `UPDATE member SET s_money = ? WHERE user_id = ?;`
                params.push((hazelMoneyBal + totalRefund), user_id);

                db.query(sql, params, function(errA, resultsA) {
                  if (errA) throw errA;
                  req.session.reqResult = "주문취소가 처리되었습니다. 헤이즐페이로 " + fn.formatNum(totalRefund).toString() + "원 환불되었습니다.";
                  res.redirect('/my-notification');
                });
              });
            } else if (reqReceiptMode == 'direct') {
              res.redirect('/checkout-certificate/' + reqOrderId);
            } else {
              res.redirect('/my-notification');
            }
        })

    }
}
