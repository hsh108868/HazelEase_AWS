const fn = require("../lib/other"); // 정의된 함수들


/* ------------------------------ 주소 보이기 ------------------------------ */

exports.show = function(req, res) {
    const user_id = req.session.user_id;

    if (!req.session.loggedin) {
        res.redirect("/login");
        res.end();
    } else {
        db.query('select * from address where user_id = ?;',
            [user_id],
            function(err, results, fields) {
                if (err) throw err;
                res.render('addresses.ejs', {
                    user_id: user_id,
                    data: results,
                    noOfCartItems: req.session.noOfCartItems,
                    noOfWishlistItems: req.session.noOfWishlistItems,
                    formatNum: fn.formatNum
                });
            });
    }
};


/* ------------------------------ 주소록 수정 ------------------------------ */

exports.updateAddress = function (req, res) {
    const user_id = req.session.user_id;
    var reqAddressId = req.params.addressId;

    // 로그인된 상태 아니면 로그인 페이지로 이동
    if (!req.session.loggedin) {
        res.redirect("/login");
        res.end();
    } else {
        if(req.method == 'POST')  {

            var sql = 'UPDATE address SET state = ?, city = ?, address = ?, zip = ? WHERE address_id = ?; select address_id from address where address_id = ?';
            var post = {
                state: req.body.state,
                city: req.body.city,
                address: req.body.address,
                zip: req.body.zip,
                user_id:req.session.user_id
            }
            var params = [post.state, post.city, post.address, post.zip, reqAddressId, reqAddressId]

            db.query(sql, params,function (err, results, field) {
                if (err) throw err
                res.render('address-edit.ejs', {
                    user_id: user_id,
                    data: results[0],
                    address : results[1],
                    noOfCartItems: req.session.noOfCartItems,
                    noOfWishlistItems: req.session.noOfWishlistItems,
                });
            });
        } else {
            var sql = 'select * from address where user_id = ?; select address_id from address where address_id = ?';
            var params = [user_id, reqAddressId]
            db.query(sql, params, function (err, results, field) {
                res.render('address-edit.ejs', {
                    user_id : user_id,
                    data : results[0],
                    address: results[1],
                    noOfCartItems: req.session.noOfCartItems,
                    noOfWishlistItems: req.session.noOfWishlistItems,
                })
            })
        }
    }
}


/* ------------------------------ 주소록 추가 ------------------------------ */

exports.saveAddress = function (req, res) {
    const user_id = req.session.user_id;

    // 로그인된 상태 아니면 로그인 페이지로 이동
    if (!req.session.loggedin) {
        res.redirect("/login");
        res.end();
    } else {
        if(req.method == 'POST')  {
            var post = {
                state: req.body.state,
                city: req.body.city,
                address: req.body.address,
                zip: req.body.zip,
                user_id:req.session.user_id
            }
            db.query('insert into address set ?', post, function (err, results, field) {
                if (err) throw err
                res.render('address-new.ejs', {
                    user_id: user_id,
                    data: results,
                    noOfCartItems: req.session.noOfCartItems,
                    noOfWishlistItems: req.session.noOfWishlistItems,
                });
            });
        } else {
            res.render('address-new.ejs', {user_id : user_id,
                noOfCartItems: req.session.noOfCartItems,
                noOfWishlistItems: req.session.noOfWishlistItems});
        }
    }
}


/* ------------------------------ 주소록 삭제 ------------------------------ */

exports.delete = function (req, res) {
    var reqAddressId = req.params.addressId;

    var sql = 'delete from address where address_id=?;';
    var params = [reqAddressId];

    if (!req.session.loggedin) {
        res.redirect("/login");
        res.end();
    } else {
        db.query(sql, params, function (err, results) {
            if (err) {
                res.send('주소록 삭제 실패');
                throw err;
            } else {
                console.log("성공적으로 삭제되었습니다.");
            }
            res.redirect('/account/manage-address');
        })
    }
}

/* ------------------------------ 기본 주소 지정 ------------------------------ */

exports.default = function (req, res) {
    var user_id = req.session.user_id;
    var reqAddressId = req.params.addressId;

    var sql = 'update member set default_address = ? where user_id = ?;';
    var params = [reqAddressId, user_id];

    if (!req.session.loggedin) {
        res.redirect("/login");
        res.end();
    } else {
        db.query(sql, params, function (err, results) {
            if (err) {
                res.send('업데이트 실패');
                throw err;
            } else {
                console.log("성공적으로 업데이트 되었습니다.");
            }
            res.redirect('/account/manage-address');
        })
    }
}




