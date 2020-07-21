//미들웨어 import

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

//사용 준비

router.use(bodyParser.urlencoded({extended: false}));
router.use(cookieParser());
app.use(session({
    secret : 'keyboard cat',
    resave : false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());



passport.serializeUser(function (user, done) {
    console.log("serializeUser")
    done(null, user.ID);
});

passport.deserializeUser(function (id, done) {
    var sql = 'select * from user where user_id = ?';
    mysql.query(sql, [id], function (error, result) {
        done(error, rows[0]);
    })
});

var mysql = require('mysql');
var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'hazelease'
});

connection.connect();

//로그인 처리

router.get('/login', function (req, res, next) {
    var userId = "";
    if(req.cookies['loginId'] !== undefined) {
        userId = req.cookies['rememberId'];
    }
    res.render('login', {userId : userId});
});

passport.use(new LocalStrategy ({
    usernameField: 'userid',
    passwordField: 'password'
    },
    function (username, password, done) {
        var sql = 'select * from member where user_id = ? and password = ?';
        mysql.query(sql, [username, password], function (error, result) {
            if(error) console.log('mysql 에러');

            if(result.length == 0) { //ID와 비밀번호에 일치하는 회원번호가 없다면
                console.log('ID나 비밀번호를 다시 입력해주시길 바랍니다.');
                return done(null, false, {message : 'Incorrect'});
            } else {
                console.log(result);
                var json = JSON.stringify(result[0]);
                var userinfo = JSON.parse(json);
                return done (null, userinfo); //result값으로 받아진 회원정보를 return
            }
        })
    }
));

router.get('/main', function (req, res) {
    res.render('home', {"user_id" : req.user.ID});
});

router.post('/logincheck',
    passport.authenticate('local', { successRedirect:'/main',
                                     failureRedirect:'/login',
                                     failureFlush: true})
);

module.exports = router;
