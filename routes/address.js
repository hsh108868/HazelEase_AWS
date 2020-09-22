/* ------------------------------ 주소록 추가 ------------------------------ */
exports.add = function (req, res) {
  const user_id = req.session.user_id;

  var post = {
    recipient: req.body.recipient,
    state: req.body.state,
    city: req.body.city,
    address: req.body.address,
    zip: req.body.zip,
    phone: req.body.phone,
    user_id: user_id
  }

  db.query('INSERT INTO address SET ?', post, function (err, results, field) {
    if (err) throw err;
    res.redirect('/account/manage-address');
  });
}

/* ------------------------------ 주소록 수정 ------------------------------ */
exports.update = function (req, res) {
  const user_id = req.session.user_id;
  var reqAddressId = req.params.addressId;

  var post = {
    recipient: req.body.recipient,
    state: req.body.state,
    city: req.body.city,
    address: req.body.address,
    zip: req.body.zip,
    phone: req.body.phone
  }

  var sql = 'UPDATE address SET recipient = ?, state = ?, city = ?, address = ?, zip = ?, phone = ? WHERE address_id = ?;'
  var params = [post.recipient, post.state, post.city, post.address, post.zip, post.phone, reqAddressId];

  db.query(sql, params, function (err, results, field) {
    if (err) throw err;
    req.session.openAddressInfo = null;
    res.redirect('/account/manage-address');
  });
}

/* ------------------------------ 주소록 삭제 ------------------------------ */
exports.delete = function (req, res) {
    var user_id = req.session.user_id;
    var reqAddressId = req.params.addressId;

    if (!req.session.loggedin) {
        req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
        res.redirect("/login");
        res.end();
    } else {
      var sql = 'SELECT default_address FROM member WHERE user_id = ?';
      var params = [user_id];

      db.query(sql, params, function (err, results) {
        sql = '';
        params = [];

        if (results[0].default_address == reqAddressId) {
          sql = `UPDATE member SET default_address = NULL WHERE user_id = ?; `
          params.push(user_id);
        }

        sql +=  `DELETE FROM address WHERE address_id = ?; `
        params.push(reqAddressId);

        db.query(sql, params, function (err, results) {
          if (err) throw err;
          res.redirect('/account/manage-address');
        });

      });
    }
}

/* ------------------------------ 기본 주소 지정 ------------------------------ */
exports.default = function (req, res) {
  var user_id = req.session.user_id;
  var reqAddressId = req.params.addressId;

  if (!req.session.loggedin) {
      req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
      res.redirect("/login");
      res.end();
  } else {
    var sql = 'UPDATE member SET default_address = ? WHERE user_id = ?;';
    var params = [reqAddressId, user_id];
    db.query(sql, params, function (err, results) {
      if (err) throw err;
      res.redirect('/account/manage-address');
    });
  }
}

/* ------------------------------ 수정 모드 여는/닫는 처리 ------------------------------ */
exports.edit = function (req, res) {
  var user_id = req.session.user_id;
  var reqMode = req.params.mode;
  var reqAddressId = req.params.addressId;

  if (!req.session.loggedin) {
      req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
      res.redirect("/login");
      res.end();
  } else {
    if (reqMode == 'open') {
      var sql = 'SELECT * FROM address WHERE address_id = ?;'
      var params = [reqAddressId];
      db.query(sql, params, function (err, results) {
        if (err) throw err;
        req.session.openAddressInfo = results[0];
        res.redirect('/account/manage-address');
      });
    } else if (reqMode == 'close') {
      req.session.openAddressInfo = null;
      res.redirect('/account/manage-address');
    }
  }
}
