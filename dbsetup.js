/* 테이블 생성법
 * 1. 서버 시작 - nodemon dbsetup.js
 * 2. 해당 테이블을 생성하고 싶을 때 localhost:3000/cr_tb_<테이블명>에 접근
 * 3. 필요한 테이블 생성한 후 ctrl + c로 서버를 종료
 * 4. 계속 작업하려면 웹의 서버 시작 - nodemon app.js
 */

const express = require("express");
const mysql = require("mysql");
const connection = require("./lib/dbconn"); // db 상수 가져오기

const app = express();

// DB연결 체크
const db = connection.db;
db.connect(function(err) {
  if (err) throw err;
  console.log("Database connected!");
});

// member 테이블 생성
app.get("/cr_tb_member", function(req, res) {
  var sql = `create table member (
  	user_id varchar(30) not null,
  	password varchar(200) not null,
  	fullname varchar(50) not null,
  	gender char(1),
  	birth date,
  	email varchar(50),
  	phone varchar(20),
  	s_money int,
  	creation_time timestamp default current_timestamp,
  	primary key(user_id)
  );`

  db.query(sql, function(err, result) {
    if(err) {
      res.send("Table already exists!");
      throw err;
    }
    console.log(result);
    res.send("Table created..");
  })
});

// address 테이블 생성
app.get("/cr_tb_address", function(req, res) {
  var sql = `create table address (
  	address_id int unsigned not null auto_increment,
  	address varchar(100) not null,
  	city varchar(20),
  	state varchar(20),
  	zip char(5),
  	user_id varchar(30) not null,
  	primary key(address_id),
  	foreign key(user_id) references member(user_id) on delete cascade
  );`

  db.query(sql, function(err, result) {
    if(err) {
      res.send("Table already exists!");
      throw err;
    }
    console.log(result);
    res.send("Table created..");
  })
});

// product 테이블 생성
app.get("/cr_tb_product", function(req, res) {
  var sql = `create table product (
  	product_id int unsigned not null auto_increment,
  	product varchar(100) not null,
  	info varchar(300),
  	cost int unsigned not null,
  	user_id varchar(30) not null,
  	review double unsigned,
  	quantity int unsigned not null,
  	qrcode varchar(200),
  	primary key(product_id),
  	foreign key(user_id) references member(user_id) on delete cascade
  );`

  db.query(sql, function(err, result) {
    if(err) {
      res.send("Table already exists!");
      throw err;
    }
    console.log(result);
    res.send("Table created..");
  })
});

// seller 테이블 생성
app.get("/cr_tb_seller", function(req, res) {
  var sql = `create table seller (
  	user_id varchar(30) not null,
  	product_id int unsigned not null,
  	address varchar(100) not null,
  	phone varchar(20),
  	email varchar(50),
  	foreign key(user_id) references member(user_id) on delete cascade,
  	foreign key(product_id) references product(product_id) on delete cascade
  );`

  db.query(sql, function(err, result) {
    if(err) {
      res.send("Table already exists!");
      throw err;
    }
    console.log(result);
    res.send("Table created..");
  })
});

// cart 테이블 생성
app.get("/cr_tb_cart", function(req, res) {
  var sql = `create table cart (
  	cart_id int unsigned not null auto_increment,
  	user_id varchar(30) not null,
  	product_id int unsigned not null,
  	date date not null,
  	quantity int unsigned,
  	primary key(cart_id),
  	foreign key(user_id) references member(user_id) on delete cascade,
  	foreign key(product_id) references product(product_id) on delete cascade
  );`

  db.query(sql, function(err, result) {
    if(err) {
      res.send("Table already exists!");
      throw err;
    }
    console.log(result);
    res.send("Table created..");
  })
});

// wishlist 테이블 생성
app.get("/cr_tb_wishlist", function(req, res) {
  var sql = `create table wishlist (
  	wishlist_id int unsigned not null auto_increment,
  	user_id varchar(30) not null,
  	product_id int unsigned not null,
  	date date not null,
  	primary key(wishlist_id),
  	foreign key(user_id) references member(user_id) on delete cascade,
  	foreign key(product_id) references product(product_id) on delete cascade
  );`

  db.query(sql, function(err, result) {
    if(err) {
      res.send("Table already exists!");
      throw err;
    }
    console.log(result);
    res.send("Table created..");
  })
});

app.listen(3000, function() {
  console.log("Server has started at port 3000.");
});
