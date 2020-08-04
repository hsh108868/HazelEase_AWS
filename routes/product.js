exports.showDetails = function(req, res) {
  const user_id = req.session.user_id;
  const reqProductId = req.params.productId;

  db.query('SELECT * FROM ?? WHERE product_id = ?', ['product', reqProductId], function(err, results, fields) {
    if (err) throw err;
    if (results.length > 0) { // 제품 아이디가 존재하는 경우
      res.render('product.ejs', { user_id: user_id, data: results });
    } else { // 제품 아이디가 없는 경우
      req.session.message = "요청한 제품의 정보가 없습니다.";
      res.render('product.ejs', { user_id: user_id, message: req.session.message});
    }
  });
};
