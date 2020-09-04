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

app.get("/cr_tb_:tableName", function(req, res) {
  var tableName = req.params.tableName;
  var sql;

  switch (tableName) {

    // (사용자)address 테이블 생성 쿼리
    case "address":
      sql = `create table address (
        address_id int unsigned not null auto_increment,
        recipient varchar(30),
        address varchar(100) not null,
        city varchar(20),
        state varchar(20),
        zip char(5),
        phone varchar(20),
        user_id varchar(30) not null,
        primary key(address_id),
        foreign key(user_id) references member(user_id) ON DELETE SET NULL
      );`
      break;

    // member 테이블 생성 쿼리
    case "member":
      sql = `create table member (
        user_id varchar(30) not null,
        password varchar(200) not null,
        fullname varchar(50) not null,
        gender char(1),
        birth date,
        email varchar(50),
        phone varchar(20),
        s_money int,
        default_address int unsigned,
        creation_time timestamp default current_timestamp,
        primary key(user_id),
        foreign key(default_address) references address(address_id) on delete cascade
      );`
      break;

    // seller 테이블 생성 쿼리
    case "seller":
      sql = `create table seller (
        seller_id varchar(30) not null,
        name varchar(50) not null,
        address varchar(100) not null,
        phone varchar(20) not null,
        email varchar(50) not null,
        primary key(seller_id)
      );`
      break;

    // product 테이블 생성 쿼리
    case "product":
      sql = `create table product (
        product_id int unsigned not null auto_increment,
        product varchar(100) not null,
        type_avail varchar(100),
        info text,
        price int unsigned not null,
        discount int(3) unsigned,
        seller_id varchar(30) not null,
        rating double unsigned,
        category varchar(50),
        qrcode varchar(200),
        primary key(product_id),
        foreign key(seller_id) references seller(seller_id) on delete cascade
      );`
      break;

    // cart 테이블 생성 쿼리
    case "cart":
      sql = `create table cart (
        cart_id int unsigned not null auto_increment,
        user_id varchar(30) not null,
        product_id int unsigned not null,
        type varchar(50),
        quantity int(10) unsigned,
        date date not null,
        checked int(1),
        primary key(cart_id),
        foreign key(user_id) references member(user_id) on delete cascade,
        foreign key(product_id) references product(product_id) on delete cascade
      );`
      break;

    // wishlist 테이블 생성 쿼리
    case "wishlist":
      sql = `create table wishlist (
        wishlist_id int unsigned not null auto_increment,
        user_id varchar(30) not null,
        product_id int unsigned not null,
        date date not null,
        primary key(wishlist_id),
        foreign key(user_id) references member(user_id) on delete cascade,
        foreign key(product_id) references product(product_id) on delete cascade
      );`
      break;

    // coupon 테이블 생성 쿼리
    case "coupon":
      sql = `create table coupon (
        coupon_code varchar(30) not null,
        value int unsigned not null,
        min_spend int unsigned not null,
        effective_date date not null,
        expiry_date date not null,
        seller_id varchar(30) not null,
        primary key(coupon_code),
        foreign key(seller_id) references seller(seller_id) on delete cascade
      );`
      break;

    // shop 테이블 생성 쿼리
    case "shop":
      sql = `create table shop (
        shop_id int unsigned not null auto_increment,
        shop varchar(50) not null,
        address varchar(100) not null,
        phone varchar(20) not null,
        seller_id varchar(30) not null,
        primary key(shop_id),
        foreign key(seller_id) references seller(seller_id) on delete cascade
      );`
      break;

    // stock 테이블 생성 쿼리
    case "stock":
      sql = `create table stock (
        product_id int unsigned not null,
        shop_id int unsigned not null,
        quantity varchar(250) not null,
        seller_id varchar(30) not null,
        primary key(product_id, shop_id),
        foreign key(product_id) references product(product_id) on delete cascade,
        foreign key(shop_id) references shop(shop_id) on delete cascade,
        foreign key(seller_id) references seller(seller_id) on delete cascade
      );`
      break;

    // image 테이블 생성 쿼리
    case "image":
      sql = `create table image (
        image_id int unsigned not null auto_increment,
        file varchar(100) not null,
        user_id varchar(30),
    	  seller_id varchar(30),
    	  product_id int unsigned,
        primary key(image_id),
        foreign key(product_id) references product(product_id) on delete cascade,
        foreign key(user_id) references member(user_id) on delete cascade,
        foreign key(seller_id) references seller(seller_id) on delete cascade
      );`
  }

  db.query(sql, function(err, result) {
    if (err) {
      res.send("Table already exists or wrong query format! Restart the server to try again.");
      throw err;
    }
    console.log(result);
    res.send("Table created successfully..");
  });
});

/* product 테이블의 더미 데이터 */
// INSERT INTO `product`(`product_id`, `product`, `type_avail`, `info`, `price`, `discount`, `user_id`, `rating`, `quantity`, `category`) VALUES (1, "Porstina - Embroidered Zip Jacket", "Black,White", "Oversized jacket accented with durable metallic zipper at the center front and minimal embroidery ooze streetwear vibes. Its drop-shoulder cut is accentuated with cinched elastic cuffs and roomy welt pockets. Available in a range of sizes.", 23356, 30, "Porstina", "4.6", 57, "Clothing");
//
// INSERT INTO `product`(`product_id`, `product`, `type_avail`, `info`, `price`, `user_id`, `rating`, `quantity`, `category`) VALUES (2, "HANO - Lace-Up Short Boots", "Black,Dark Blue", "A boot, plural boots, is a type of specific footwear. Most boots mainly cover the foot and the ankle, while some also cover some part of the lower calf. Some boots extend up the leg, sometimes as far as the knee or even the hip. Most boots have a heel that is clearly distinguishable from the rest of the sole, even if the two are made of one piece. Traditionally made of leather or rubber, modern boots are made from a variety of materials. Boots are worn both for their functionality – protecting the foot and leg from water, extreme cold, mud or hazards (e.g., work boots may protect wearers from chemicals or use a steel toe) or providing additional ankle support for strenuous activities with added traction requirements (e.g., hiking), or may have hobnails on their undersides to protect against wear and to get better grip; and for reasons of style and fashion.", 109153, "Hano", "3.4", 24, "Shoes");
//
// INSERT INTO `product`(`product_id`, `product`, `type_avail`, `info`, `price`, `discount`, `user_id`, `rating`, `quantity`, `category`) VALUES (3, "Carryme - Set: Lightweight Backpack + Pouch", "Green,Khaki", "This pretty drawstring bag has a perfect size for transporting man's or woman's swim gear or PE kit or other essentials for the gym, school and other short trips. Put it on your back and you won't even notice it's there when out on short excursions or bike trips..", 54208, 15, "Trencur", "5.0", 20, "Bags");
//
// INSERT INTO `product`(`product_id`, `product`, `type_avail`, `info`, `price`, `discount`, `user_id`, `rating`, `quantity`, `category`) VALUES (4, "Aisyi - Blue Light Blocking Glasses", "Red,Gold,Brown", "As practical as they’re stylish, these black-rimmed glasses with thin but study frames are fitted with blue light blocking technology to protect the eyes. Perfect for long days in front of the computer as well as for quick pre-bedtime peeks at your phone!", 14372, 30, "Trencur", "2.6", 192, "Accessories");

app.listen(3000, function() {
  console.log("Server has started at port 3000.");
});
