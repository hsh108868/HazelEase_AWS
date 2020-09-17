const fn = require("../lib/other"); // 정의된 함수들 가져오기

/* ------------------------------ notification 페이지에 출력 ------------------------------ */
exports.show = function (req, res) {
    var user_id = req.session.user_id;

    if (!req.session.loggedin) {
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
               GROUP BY o.order_id;

               SELECT * FROM image;

               SELECT trans_id, date
               FROM transaction
               WHERE user_id = ?;

               SELECT * FROM orders WHERE user_id = ? AND (status = 'delivery' OR status = 'pickup'); `

        params = [user_id, user_id, user_id, user_id, user_id];

        db.query(sql, params, function (err, results, fields) {
            if (err) throw err;
            req.session.noOfNotifications = results[1].length;
            req.session.noOfReceivingItems = results[5].length;

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

    if (!req.session.loggedin) {
        res.redirect("/login");
        res.end();
    } else {
        var sql = `UPDATE orders SET status = ?, latest_update = ? WHERE order_id = ?; `

        if (reqReceiptMode == 'delivery') {
            var params = [reqReceiptMode, now, reqOrderId];
        } else if (reqReceiptMode == 'pickup') {
            var params = [reqReceiptMode, now, reqOrderId];
        } else if (reqReceiptMode == 'direct') {
            var params = [reqReceiptMode, now, reqOrderId];
        }

        db.query(sql, params, function (err, results) {
            if (err) throw err;
            res.redirect('/my-notification');
        })

    }
}
