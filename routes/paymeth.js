/* ------------------------------ HazelPay 충전/인출 처리 ------------------------------ */
exports.hazelPay = function(req, res) {
  const user_id = req.session.user_id;
  let mode = req.body.processMode;
  let amount = req.body.amountInput * 10000;
  let balance = eval(req.body.balance);
  let sql = 'UPDATE member SET s_money = ? WHERE user_id = ?';
  let params;

  if(mode == "recharge") {
    if (balance + amount > 10000000) {
      req.session.messageErr = "안전을 위해 천만원 이상을 보관할 수 없습니다. ";
      res.redirect('/account/payment-method');
      return;
    }

    params = [balance + amount, user_id];
    db.query(sql, params, function(err, results) {
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
    db.query(sql, params, function(err, results) {
      if (err) throw err;
      req.session.message = "인출 완료되었습니다.";
      res.redirect('/account/payment-method');
    });

  }
}
