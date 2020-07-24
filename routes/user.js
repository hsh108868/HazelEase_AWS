// const mysql = require("mysql");
// const connection = require("../lib/dbconn"); // DB 연결
// db = connection.db;
const bcrypt = require("bcrypt");
const saltRounds = 10;

/* ------------------------------ signup 처리 호출 ------------------------------ */
exports.signup = function(req, res) {
  var message = "";
  var pw = req.body.password;
  var pw_c = req.body.password_confirm;

  if (req.method == "POST") {
    if (pw == pw_c) {
      bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        var post = {
          fullname: req.body.fullname,
          user_id: req.body.userid,
          password: hash,
          gender: req.body.gender,
          birth: req.body.yy + "-" + req.body.mm + "-" + req.body.dd,
          email: req.body.email,
          phone: req.body.no_tel,
        }

        var query = db.query('INSERT INTO member SET ?', post, function(error, results, fields) {
          if (error) throw error;
          message = "회원가입이 완료되었습니다.";
          res.render('signup.ejs', {
            message: message,
            statusCode: 200
          });
        });
      });
    } else {
      message = "비밀번호가 일치하지 않습니다.";
      res.render('signup.ejs', {
        message: message,
        statusCode: 400
      });
    }
  } else {
    db.query('SELECT ?? FROM ??', ['user_id', 'member'], function(err, results, fields) {
      regUserids = []
      results.forEach(function(member) {
        regUserids.push(member.user_id);
      })
      res.render('signup.ejs', { message: message, regUserids: regUserids  });
    });
  }

  /* Status Code:
   * 1xx informational response – the request was received, continuing process (정상 반응)
   * 2xx successful – the request was successfully received, understood, and accepted (성공적으로 됐을 때)
   * 3xx redirection – further action needs to be taken in order to complete the request (계속 해야 할 때)
   * 4xx client error – the request contains bad syntax or cannot be fulfilled (사용자가 잘못했을 때)
   * 5xx server error – the server failed to fulfill an apparently valid request (서버로부터 오류 띄웠을 때)
   */
};

/* ------------------------------ login 처리 호출 ------------------------------ */
exports.login = function(req, res) {
  var message = "";
  const userid = req.body.userid;
  const password = req.body.password;

  if (req.method == "POST") {
    db.query('SELECT ?? FROM ?? WHERE user_id = ?', [
      ['user_id', 'password'], 'member', userid
    ], function(err, results, fields) {
      if (err) throw err;
      if (results.length > 0) {
        bcrypt.compare(password, results[0].password, function(err, result) {
          if (result === true) {
            req.session.loggedin = true;
            req.session.user_id = results[0].user_id;
            res.redirect('/home');
          } else {
            message = "잘못된 아이디 또는 비밀번호!";
            res.render('login.ejs', { message: message, statusCode: 400 });
          }
        });
      } else {
        message = "잘못된 아이디 또는 비밀번호!";
        res.render('login.ejs', { message: message, statusCode: 400 });
      }
    });

  } else {
    res.render('login.ejs', {
      message: message,
      statusCode: 100
    });
  }

};

/* ------------------------------ logout 처리 호출 ------------------------------ */
exports.logout = function(req, res) {
  req.session.destroy(function(err) {
    res.redirect("/login");
  })
};

/* ------------------------------ profile 처리 호출 ------------------------------ */
exports.profile = function(req, res) {
  var user_id = req.session.user_id;

  // 로그인된 상태 아니면 로그인 페이지로 이동
  if (!req.session.loggedin) {
    res.redirect("/login");
  }

  // 로그인된 아이디의 해당 정보들을 가져오고 profile 페이지로 넘겨줌
  db.query('SELECT * FROM ?? WHERE user_id = ?', ['member', user_id], function(err, results, fields) {
    res.render('profile.ejs', { user_id: user_id, data: results });
  });
};
