//미들웨어 import

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

app.use(session({
    secret : 'keyboard cat',
    resave : false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

//사용 준비

router.use(bodyParser.urlencoded({extended: false}));
router.use(cookieParser());
router.use(passport.initialize());
router.use(passport.session());

passport.use('local-join', new LocalStrategy({
    usernameField: 'userid',
    passwordField: 'password',
    confirmField: 'password_confirm',
    genderField: 'gender',
    birthField: 'birth',
    emailField: 'email',
    telField: 'tel',
    passReqToCallback: true
}, function (req, userid, password, done) {
    console.log('local-join');
}))

var mysql = require('mysql');
var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'a10069852',
    database : 'HazelEase'
});

connection.connect();


router.post('/signupcheck', passport.authenticate('local-join', {
    successRedirect : '/main',
    failureRedirect : '/signup',
    failureFlush: true
}, function (req, userid, password, password_confirm, gender, birth, email, tel, done) {
    var sql = 'select * from member where user_id = ?';
    var query = client.query(sql, [userid], function (error, datas) {
        if(error) return done(error);
        if(datas.length) {
            console.log('existed user');
            return done(null, false, {
                message: '이미 존재하는 아이디입니다.'
            });
        } else {
            var sql = 'insert into member (userid, password, password_confirm, gender, birth, email, tel) values (?,?,?,?,?,?,?)';
            var query = client.query(sql, [userid, password, password_confirm, gender, birth, email, tel])
            if (error) return done(error);
            retrun
            done(null, {
                'userid': userid,
                'id': datas.insertId
            });
        }
    })
}))
