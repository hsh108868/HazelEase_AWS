const fn = require("../lib/other"); // 정의된 함수들 가져오기
const QRCode = require('qrcode');

/* ------------------------------ 수령목록 페이지 ------------------------------ */
exports.list = function (req, res) {
    var user_id = req.session.user_id;

    if (!req.session.loggedin) {
        req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
        res.redirect("/login");
        res.end();
    } else {
        let sql = `SELECT o.trans_id, o.order_id, p.product_id, p.product, o.type, o.quantity, sh.shop_id, sh.shop, se.name as sellername, o.latest_update
                   FROM product as p
                      RIGHT OUTER JOIN orders as o ON p.product_id = o.product_id
                      RIGHT OUTER JOIN shop as sh ON sh.shop_id = o.shop_id
                      RIGHT OUTER JOIN seller as se ON se.seller_id = p.seller_id
                   WHERE status = 'delivery' AND user_id = ?
                   ORDER BY o.trans_id ASC, o.order_id ASC, p.seller_id ASC;

                   SELECT o.trans_id, o.order_id, o.seller_id, s.name as sellername, COUNT(*) as count
                   FROM orders as o
                      RIGHT OUTER JOIN seller as s ON s.seller_id = o.seller_id
                   WHERE status = 'delivery' AND user_id = ?
                   GROUP BY o.order_id;

                   SELECT o.trans_id, o.order_id, p.product_id, p.product, o.type, o.quantity, sh.shop_id, sh.shop, se.name as sellername, o.latest_update
                   FROM product as p
                      RIGHT OUTER JOIN orders as o ON p.product_id = o.product_id
                      RIGHT OUTER JOIN shop as sh ON sh.shop_id = o.shop_id
                      RIGHT OUTER JOIN seller as se ON se.seller_id = p.seller_id
                   WHERE status = 'pickup' AND user_id = ?
                   ORDER BY o.shop_id ASC;

                   SELECT o.trans_id, o.order_id, o.seller_id, se.name as sellername, sh.shop_id, sh.shop, sh.address, COUNT(*) as count
                   FROM orders as o
                      RIGHT OUTER JOIN seller as se ON se.seller_id = o.seller_id
                      RIGHT OUTER JOIN shop as sh ON sh.shop_id = o.shop_id
                   WHERE status = 'pickup' AND user_id = ?
                   GROUP BY o.shop_id;

                   SELECT * FROM image;

                   SELECT order_id FROM orders WHERE user_id = ? AND status = 'direct'; `
        let params = [user_id, user_id, user_id, user_id, user_id, user_id];

        db.query(sql, params, function (err, results) {
                if (err) throw err;
                req.session.noOfReceivingItems = results[0].length + results[2].length + (results[5].length > 0 ? 1 : 0) ;

                res.render('receipt.ejs', {
                    user_id: user_id,
                    deliveryItems: results[0],
                    onDelivery: results[1],
                    pickupItems: results[2],
                    onPickup: results[3],
                    images: results[4],
                    currDirect: results[5][0],
                    sess: req.session,
                })
        })
    }
}
/* ------------------------------ 수령목록: 픽업의 수령확인 처리 ------------------------------ */
exports.confirm = function (req, res) {
  var user_id = req.session.user_id;
  var reqOrderId = req.params.orderId;
  var reqProductId = req.params.productId;
  var reqType = req.params.type;
  var reqShopId = req.params.shopId;
  var now = new Date();

  if (!req.session.loggedin) {
      req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
      res.redirect("/login");
      res.end();
  } else {
      let sql = `UPDATE orders SET status = 'completed', latest_update = ? WHERE user_id = ? AND order_id = ? AND product_id = ? AND type = ? AND shop_id = ?; `
      let params = [now, user_id, reqOrderId, reqProductId, reqType, reqShopId];

      db.query(sql, params, function (err, results) {
          if (err) throw err;
          res.redirect('/my-receipt');
      });
  }
}

/* ------------------------------ 구매상세내역(영수증) 처리 ------------------------------ */
exports.purchaseDetails = function (req, res) {
  var user_id = req.session.user_id;
  var reqTransId = req.params.transId;

  let sql = `SELECT * FROM transaction WHERE user_id = ? AND trans_id = ?;

             SELECT *, o.price as waspriced, se.name as sellername
             FROM orders as o
                RIGHT OUTER JOIN product as p ON p.product_id = o.product_id
                RIGHT OUTER JOIN shop as s ON s.shop_id = o.shop_id
                RIGHT OUTER JOIN seller as se on se.seller_id = o.seller_id
             WHERE user_id = ? AND trans_id = ?
             ORDER BY order_id ASC, status DESC;

             SELECT order_id, COUNT(*) as count
             FROM orders
             WHERE user_id = ? AND trans_id = ?
             GROUP BY order_id
             ORDER BY order_id ASC;

             SELECT * FROM image; `
  let params = [user_id, reqTransId, user_id, reqTransId, user_id, reqTransId];

  if (!req.session.loggedin) {
      req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
      res.redirect("/login");
      res.end();
  } else {
    db.query(sql, params, function (err, results) {
      if (err) throw err;
      res.render('purchase-invoice.ejs', {
        user_id: user_id,
        sess: req.session,
        formatNum: fn.formatNum,
        noInvoice: reqTransId,
        transInfo: results[0][0],
        ordersInfo: results[1],
        ordersCount: results[2],
        images: results[3]
      });
    });
  }
}

/* ------------------------------ 픽업증권 생성 처리 ------------------------------ */
exports.pickupCert = function (req, res) {
  var user_id = req.session.user_id;
  var reqTransId = req.params.transId;
  var reqOrderId = req.params.orderId;
  var reqShopId = req.params.shopId;

  let sql = `SELECT *, se.name as sellername
             FROM orders as o
                RIGHT OUTER JOIN product as p ON p.product_id = o.product_id
                RIGHT OUTER JOIN shop as s ON s.shop_id = o.shop_id
                RIGHT OUTER JOIN seller as se on se.seller_id = o.seller_id
             WHERE o.user_id = ? AND s.shop_id = ? AND status = 'pickup';

             SELECT * FROM transaction WHERE trans_id = ?;

             SELECT * FROM image; `
  let params = [user_id, reqShopId, reqTransId];

  if (!req.session.loggedin) {
      req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
      res.redirect("/login");
      res.end();
  } else {
    db.query(sql, params, function (err, results) {
      if (err) throw err;

      /* --  관련 구매번호 몇 개 계산 -- */
      var data = results[0];
      var transIds = [data[0].trans_id];
      var prevTransId = data[0].trans_id;

      for (let i = 1; i < data.length; i++) {
        if (data[i].trans_id != prevTransId) {
          transIds.push(data[i].trans_id);
          prevTransId = data[i].trans_id;
        }
      }
      /* --------------------------- */


      let textLink = "localhost:3000/qrcode/pickup-complete/tid/" + transIds + "/sid/" + reqShopId;
      QRCode.toDataURL(textLink, { errorCorrectionLevel: 'M' }, function (err, url) {
        res.render('pickup-cert.ejs', {
          user_id: user_id,
          sess: req.session,
          formatNum: fn.formatNum,
          data: results[0],
          date: results[1][0].date,
          transInfo: results[1][0],
          images: results[2],
          qrcode: url
        });
      });
    });
  }
}

/* ------------------------------ 바로가겨가기의 체크아웃 증권 생성 처리 ------------------------------ */
exports.checkoutCert = function (req, res) {
  var user_id = req.session.user_id;
  var reqOrderId = req.params.orderId;

  let sql = `SELECT *, se.name as sellername
             FROM orders as o
                RIGHT OUTER JOIN product as p ON p.product_id = o.product_id
                RIGHT OUTER JOIN shop as s ON s.shop_id = o.shop_id
                RIGHT OUTER JOIN seller as se on se.seller_id = o.seller_id
             WHERE user_id = ? AND o.order_id = ? AND status = 'direct';

             SELECT t.*
             FROM transaction as t
                RIGHT OUTER JOIN orders as o ON o.trans_id = t.trans_id
             WHERE o.order_id = ?
             GROUP BY trans_id;

             SELECT * FROM image;

             SELECT trans_id, COUNT(*) as count
             FROM orders
             WHERE status = 'waiting' AND user_id = ?
             GROUP BY trans_id;

             SELECT order_id FROM orders WHERE user_id = ? AND (status = 'delivery' OR status = 'pickup');
             SELECT order_id FROM orders WHERE user_id = ? AND status = 'direct'; `
  let params = [user_id, reqOrderId, reqOrderId, user_id, user_id, user_id];

  if (!req.session.loggedin) {
      req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
      res.redirect("/login");
      res.end();
  } else {
    db.query(sql, params, function (err, results) {
      if (err) throw err;
      req.session.noOfNotifications = results[3].length;
      req.session.noOfReceivingItems = results[4].length + (results[5].length > 0 ? 1 : 0);

      let textLink = "localhost:3000/qrcode/direct-checkout-complete/oid/" + reqOrderId + "/sid/" + results[0][0].shop_id;
      QRCode.toDataURL(textLink, { errorCorrectionLevel: 'M' }, function (err, url) {
        res.render('checkout-cert.ejs', {
          user_id: user_id,
          sess: req.session,
          formatNum: fn.formatNum,
          data: results[0],
          date: results[1][0].date,
          transInfo: results[1][0],
          images: results[2],
          qrcode: url
        });
      });
    });
  }
}
