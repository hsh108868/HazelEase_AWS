const fn = require("../lib/other"); // 정의된 함수들 가져오기

/* ------------------------------ HazelPay 충전/인출 처리 ------------------------------ */
exports.hazelPay = function (req, res) {
    const user_id = req.session.user_id;
    let mode = req.body.processMode;
    let amount = req.body.amountInput * 10000;
    let balance = eval(req.body.balance);
    let sql = 'UPDATE member SET s_money = ? WHERE user_id = ?';
    let params;

    if (mode == "recharge") {
        if (balance + amount > 10000000) {
            req.session.messageErr = "안전을 위해 천만원 이상을 보관할 수 없습니다. ";
            res.redirect('/account/payment-method');
            return;
        }

        params = [balance + amount, user_id];
        db.query(sql, params, function (err, results) {
            if (err) throw err;
            req.session.message = "충전 완료되었습니다.";
            res.redirect('/account/payment-method');
        });
    } else {
        if (amount > balance) {
            req.session.messageErr = "인출할 금액이 잔액보다 큽니다.";
            res.redirect('/account/payment-method');
            return;
        }

        params = [balance - amount, user_id];
        db.query(sql, params, function (err, results) {
            if (err) throw err;
            req.session.message = "인출 완료되었습니다.";
            res.redirect('/account/payment-method');
        });

    }
}

/* ------------------------------ notification 페이지에 출력 ------------------------------ */

exports.showNotification = function (req, res) {
    var user_id = req.session.user_id;

    if (!req.session.loggedin) {
        res.redirect("/login");
        res.end();
    } else {
        sql = `select order_id, trans_id from orders where user_id = ?;
                select a.product_id, a.product, b.type from product as a right outer join orders as b on a.product_id = b.product_id where user_id = ?;
                select a.seller_id as seller, b.name as sellername from orders as a inner join seller as b on a.seller_id = b.seller_id where user_id = ? group by seller;
                SELECT * FROM image;`

        params = [user_id, user_id, user_id];

        db.query(sql, params, function (err, results, fields) {
            if (err) throw err;

            res.render('notification.ejs', {
                user_id: user_id,
                result: results[0],
                data: results[1],
                cartCount: results[2],
                images: results[3],
                formatNum: fn.formatNum,
                couponResult: [req.session.couponCode, req.session.couponValue, req.session.couponMsg, req.session.couponStatus],
                sess: req.session
            });
        });
    }
}

/* ------------------------------ notification 선택 ------------------------------ */

exports.select = function (req, res) {
    var user_id = req.session.user_id;
    let reqNotificationMode = req.params.notificationMode;
    let reqStatus = req.params.statusId;
    var now = new Date();

    if (!req.session.loggedin) {
        res.redirect("/login");
        res.end();
    } else {
        var sql = 'select * from orders where trans_id = ?';
        db.query(sql, [reqStatus], function (err, resultsA) {
            if (reqNotificationMode == 'delivery') {
                var sql = 'UPDATE orders SET status = ?, latest_update = ? WHERE order_id = ?;'
                var params = [reqNotificationMode, now, resultsA[0].order_id];
                db.query(sql, params, function (err, results) {
                    if (err) throw err;
                    res.redirect('/my-notification');
                });
            } else if (reqNotificationMode == 'pickup') {
                var sql = 'UPDATE orders SET status = ?, latest_update = ? WHERE order_id = ?;'
                var params = [reqNotificationMode, now, resultsA[0].order_id];
                db.query(sql, params, function (err, results) {
                    if (err) throw err;
                    res.redirect('/my-notification');
                })
            }
        })

    }
}

/* ------------------------------ 수령목록 페이지 ------------------------------ */

exports.list = function (req, res) {
    var user_id = req.session.user_id;
    if (!req.session.loggedin) {
        res.redirect("/login");
        res.end();
    } else {
        db.query(`select a.product, b.product_id, b.order_id, c.name as sellername 
                      from orders as b 
                      inner join product as a on a.product_id = b.product_id
                      inner join seller as c on c.seller_id = b.seller_id
                      where user_id = ? and status = 'delivery';
                      
                      select a.product, b.product_id, b.order_id, c.name as sellername 
                      from orders as b 
                      inner join product as a on a.product_id = b.product_id
                      inner join seller as c on c.seller_id = b.seller_id
                      where user_id = ? and status = 'pickup';
                      
                      select * from image;`,
            [user_id, user_id], function (err, results) {
                if (err) throw err;
                res.render('receipt.ejs', {
                    user_id : user_id,
                    result : results[0],
                    data : results[1],
                    images: results[2],
                    sess : req.session,
                })
        })
    }
}