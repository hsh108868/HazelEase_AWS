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

app.get("/setup_db", function(req, res) {
  var sql = `
    create table address (
          address_id int unsigned not null auto_increment,
          recipient varchar(30),
          address varchar(100) not null,
          city varchar(20),
          state varchar(20),
          zip char(5),
          phone varchar(20),
          primary key(address_id)
    );

    create table member (
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
    );

    create table seller (
          seller_id varchar(30) not null,
          name varchar(50) not null,
          address varchar(100) not null,
          phone varchar(20) not null,
          email varchar(50) not null,
          primary key(seller_id)
    );

    create table product (
          product_id int unsigned not null auto_increment,
          product varchar(100) not null,
          type_avail varchar(100),
          info text,
          price int unsigned not null,
          discount int(3) unsigned,
          seller_id varchar(30) not null,
          rating double unsigned,
          category varchar(50),
          primary key(product_id),
          foreign key(seller_id) references seller(seller_id) on delete cascade
    );

    create table shop (
          shop_id int unsigned not null auto_increment,
          shop varchar(50) not null,
          address varchar(100) not null,
          phone varchar(20) not null,
          seller_id varchar(30) not null,
          primary key(shop_id),
          foreign key(seller_id) references seller(seller_id) on delete cascade
    );

    create table stock (
          product_id int unsigned not null,
          shop_id int unsigned not null,
          quantity varchar(250) not null,
          seller_id varchar(30) not null,
          primary key(product_id, shop_id),
          foreign key(product_id) references product(product_id) on delete cascade,
          foreign key(shop_id) references shop(shop_id) on delete cascade,
          foreign key(seller_id) references seller(seller_id) on delete cascade
    );

    create table cart (
          cart_id int unsigned not null auto_increment,
          user_id varchar(30) not null,
          product_id int unsigned not null,
          type varchar(50) not null,
          shop_id int unsigned not null,
          quantity int(10) unsigned,
          date date not null,
          checked int(1),
          primary key(cart_id),
          foreign key(user_id) references member(user_id) on delete cascade,
          foreign key(product_id) references product(product_id) on delete cascade,
          foreign key(shop_id) references shop(shop_id) on delete cascade
    );

    create table wishlist (
          wishlist_id int unsigned not null auto_increment,
          user_id varchar(30) not null,
          product_id int unsigned not null,
          type varchar(50),
          shop_id int unsigned,
          date date not null,
          primary key(wishlist_id),
          foreign key(user_id) references member(user_id) on delete cascade,
          foreign key(product_id) references product(product_id) on delete cascade
    );

    create table coupon (
          coupon_code varchar(30) not null,
          value int unsigned not null,
          min_spend int unsigned not null,
          effective_date date not null,
          expiry_date date not null,
          seller_id varchar(30) not null,
          primary key(coupon_code),
          foreign key(seller_id) references seller(seller_id) on delete cascade
    );

    create table image (
          image_id int unsigned not null auto_increment,
          file varchar(100) not null,
          user_id varchar(30),
          seller_id varchar(30),
          product_id int unsigned,
          primary key(image_id),
          foreign key(product_id) references product(product_id) on delete cascade,
          foreign key(user_id) references member(user_id) on delete cascade,
          foreign key(seller_id) references seller(seller_id) on delete cascade
    );

    create table transaction (
          trans_id varchar(10) not null,
          user_id varchar(30) not null,
          total_discount int unsigned,
          total_paid int unsigned,
          coupon_code varchar(30),
          coupon_value int unsigned,
          recipient varchar(30) not null,
          address varchar(150) not null,
          contact varchar(20) not null,
          date datetime not null,
          primary key(trans_id),
          foreign key(user_id) references member(user_id) on delete cascade
    );

    create table orders (
          trans_id varchar(10) not null,
          order_id varchar(10) not null,
          seller_id varchar(30) not null,
          product_id int unsigned not null,
          type varchar(30) not null,
          price int unsigned not null,
          quantity int unsigned not null,
          subtotal int unsigned not null,
          shop_id int unsigned not null,
          user_id varchar(30) not null,
          status varchar(10) not null,
          latest_update datetime not null,
          primary key(order_id, product_id, type, shop_id),
          foreign key(trans_id) references transaction(trans_id) on delete cascade,
          foreign key(seller_id) references seller(seller_id),
          foreign key(product_id) references product(product_id),
          foreign key(shop_id) references shop(shop_id),
          foreign key(user_id) references member(user_id) on delete cascade
    );

    create table review (
          trans_id varchar(10) not null,
          order_id varchar(10) not null,
          product_id int unsigned not null,
          type varchar(30) not null,
          shop_id int unsigned not null,
          user_id varchar(30) not null,
          rating float unsigned not null,
          title varchar(50),
          body text not null,
          primary key(trans_id, order_id, product_id, type, shop_id),
          foreign key(trans_id) references transaction(trans_id),
          foreign key(order_id) references orders(order_id),
          foreign key(product_id) references product(product_id),
          foreign key(shop_id) references shop(shop_id),
          foreign key(user_id) references member(user_id) on delete cascade
    );

    ALTER TABLE member ADD COLUMN default_address int unsigned AFTER s_money;
    ALTER TABLE member ADD FOREIGN KEY (default_address) REFERENCES address(address_id) ON DELETE CASCADE;
    ALTER TABLE address ADD COLUMN user_id varchar(30) not null AFTER phone;
    ALTER TABLE address ADD FOREIGN KEY (user_id) REFERENCES member(user_id) ON DELETE CASCADE;

    SET GLOBAL event_scheduler='ON';

    CREATE EVENT complete_delivery
      ON SCHEDULE EVERY 1 HOUR
      STARTS '2020-09-27 00:00:00' ON COMPLETION PRESERVE ENABLE
      DO update orders set status = 'completed', latest_update = now()
         where status = 'delivery' AND latest_update < date_sub(now(), interval 2 day);
  `

  db.query(sql, function(err, result) {
    if (err) {
      res.send("Database setup failed!");
      throw err;
    }
    console.log(result);
    res.send("Database setup success..");
  });
});

app.get("/populate_db", function(req, res) {
  var sql = `
    INSERT INTO member (user_id, password, fullname, gender, birth, email, phone, s_money, default_address, creation_time) VALUES ('usertest', '$2b$10$BT96wEK8APThmiPowuko/.vmurO5pafFvKVe/YYcdxShXjYPDfJFe', 'User Test', 'M', '1986-09-05', 'test@123.com', '+821040500632', 0, NULL, '2020-09-06 02:08:34'), ('usertest2', '$2b$10$V8jMln1zTIorpn6LGZqnOuzcvTzWjbImlXdDmzN7lmtDn541Fnvci', 'User Test2', 'F', '1983-10-31', 'test@123.com', '+821064579223', 0, NULL, '2020-09-06 02:59:30'), ('usertest3', '$2b$10$Dsw8k63D9bSm7QG39RwlreeD6H1SLbU4UgLZ.rBzMCZHsy4jpqixi', 'User Test3', 'M', '1999-11-06', 'test@123.com', '+821064579223', 0, NULL, '2020-09-06 03:13:22');

    INSERT INTO seller (seller_id, name, address, phone, email) VALUES ('usertest', 'GarmentBarn', '서울특별시 영등포구 양평동3가 45', '+8224502500', 'garmentbarn@mail.com'), ('usertest2', 'Porstina Inc.', '서울특별시 마포구 서교동 동교로22길 30', '+82231442550', 'porstina@mail.com'), ('usertest3', 'Daiso', '서울특별시 서대문구 신촌동 명물길 27', '+821064579223', 'daisy@gmail.com');

    INSERT INTO product (product_id, product, type_avail, info, price, discount, seller_id, rating, category) VALUES (NULL, 'Tenri - Stainless Steel Poker Card Pendant Necklace', 'Red/Black', 'Perfect for poker fans or simply those who like their jewelry bold and quirky, this stainless steel necklace comes with a thick curb chain and a distinctive ace card pendant. Add to a normcore outfit for an instant lift! Comes in two designs: black ace of spades and red ace of hearts. Pendant available singly.\r\n\r\nMore Information\r\nMaterial	Stainless Steel\r\nColor	1542 - Pendant - Black/Black\r\nCatalog No.	1081820803\r\n\r\nThere may be a 2cm – 4cm variance in product size because a person might measure the product differently while wearing it.\r\nFor example, if the material is flexible, like elastic fabrics or knit materials, the product size may be slightly smaller because the material will be stretched when it is being measured.\r\n \r\nAlso, for products like pants, shorts or pencil skirts, measurements may be obtained by measuring hip circumference at the lower thigh or at the middle thigh.\r\n\r\nThese varying methods of measurement may produce a difference between the stated product measurements and your expected product measurements. Please note when ordering relevant products.', '45795', '30', 'usertest', '4.7', 'Accessories'), (NULL, 'JORZ - Longline Woolen Coat', 'Light Brown/Brown/Black/Maroon', 'This demure monochrome woolen coat hits mid-thigh, keeping you warm from top to bottom.', '107393', '10', 'usertest', '4.1', 'Clothing'), (NULL, 'CHIN CHIN - Plain Messenger Bag', 'Black', 'Images are for reference only. Colors on your computer monitor may differ slightly from actual product colors depending on your monitor settings.', '37308', '12', 'usertest', '3.6', 'Bags'), (NULL, 'Sunsteps - Platform Sneakers', '', 'These plain lace-up sneakers are all you need to run errands in style. The platform outsole subtly elevates you without creating discomfort.', '25135', '0', 'usertest2', '4', 'Shoes'), (NULL, 'SOME BY MI - AHA, BHA, PHA 30 Days Miracle Cream 50ml', '', 'Packed with tea tree, AHA, BHA and PHA, this miracle cream works wonders to your skin in 30 days! It purifies, removes dead skin cells and sebum inside pores as well as preventing further loss of moisture all in one go.', '47029', '61', 'usertest2', '5', 'Beauty'), (NULL, 'THE FACE SHOP - Real Nature Face Mask 1pc (20 Types) 20g', '', 'These masks are saturated with different plant extracts to deliver intense moisture and nutrition.', '7729', '34', 'usertest2', '2.4', 'Beauty'), (NULL, 'Primitivo - Mirror Phone Case - iPhone', 'iPhone 6 / 6 Plus / 7 / 7 Plus / 8 / 8 Plus / iPhone SE / X / XR / X', 'Sleek and sturdy hard phone case that doubles as a mirror! Lightweight and full-coverage case design looks modern and keeps your phone safe. Available in pink, gold and silver. For iPhone 6 to X.', '6873', '57', 'usertest3', NULL, 'Accessories'), (NULL, 'Chimi Chimi - Wooden Tablet / Phone Stand', 'Flower/Lace/Tassel', '-', '18689', '80', 'usertest3', '4.2', 'Accessories');

    INSERT INTO image (image_id, file, user_id, seller_id, product_id) VALUES (NULL, 'neclace.jpg', NULL, NULL, '1'), (NULL, 'neclace1.jpg', NULL, NULL, '1'), (NULL, 'neclace2.jpg', NULL, NULL, '1'), (NULL, 'neclace3.jpg', NULL, NULL, '1'), (NULL, 'coat.jpg', NULL, NULL, '2'), (NULL, 'coat1.jpg', NULL, NULL, '2'), (NULL, 'coat2.jpg', NULL, NULL, '2'), (NULL, 'coat3.jpg', NULL, NULL, '2'), (NULL, 'bag.jpg', NULL, NULL, '3'), (NULL, 'bag1.jpg', NULL, NULL, '3'), (NULL, 'bag2.jpg', NULL, NULL, '3'), (NULL, 'bag3.jpg', NULL, NULL, '3'), (NULL, 'bag4.jpg', NULL, NULL, '3'), (NULL, 'shoes.jpg', NULL, NULL, '4'), (NULL, 'shoes1.jpg', NULL, NULL, '4'), (NULL, 'shoes2.jpg', NULL, NULL, '4'), (NULL, 'cream.jpg', NULL, NULL, '5'), (NULL, 'mask.jpg', NULL, NULL, '6'), (NULL, 'mask1.jpg', NULL, NULL, '6'), (NULL, 'case.jpg', NULL, NULL, '7'), (NULL, 'tabstand.jpg', NULL, NULL, '8'), (NULL, 'tabstand1.jpg', NULL, NULL, '8');

    INSERT INTO shop (shop_id, shop, address, phone, seller_id) VALUES (NULL, '롯데마트 양평점', '서울특별시 영등포구 양평동3가 45', '+8224502500', 'usertest'), (NULL, '용천자연유리 담상닷컴', '서울특별시 구로구 구로2동 487-113', '+8224572549', 'usertest'), (NULL, 'Made In Pink', '서울특별시 마포구 서교동 와우산로21길 37', '+8223325516', 'usertest'), (NULL, 'Timber Rolde - Seoul City', '서울특별시 마포구 서교동 동교로22길 30', '+82231442550', 'usertest2'), (NULL, 'THE BODY SHOP', '서울특별시 강남구 역삼동 강남대로 39', '+8225011273', 'usertest2'), (NULL, '다이소 신촌명물거리점', '서울특별시 서대문구 신촌동 명물길 27', '+82244920590', 'usertest3');

    INSERT INTO stock (product_id, shop_id, quantity, seller_id) VALUES ('1', '1', '57, 38', 'usertest'), ('1', '2', '9, 3', 'usertest'), ('1', '3', '103, 42', 'usertest'), ('2', '1', '13, 54, 32, 67', 'usertest'), ('2', '2', '3, 0, 0, 5', 'usertest'), ('3', '1', '72', 'usertest'), ('4', '4', '3535', 'usertest2'), ('5', '5', '153', 'usertest2'), ('7', '6', '23, 39, 0, 29, 4, 10, 34, 12, 0, 0', 'usertest3'), ('8', '6', '3, 8, 1', 'usertest3');
    INSERT INTO coupon (coupon_code, value, min_spend, effective_date, expiry_date, seller_id) VALUES ('AUTUMN2020', '5000', '80000', '2020-09-06', '2020-10-14', 'usertest'), ('SUMMER2020', '10000', '120000', '2020-07-07', '2020-08-28', 'usertest');
  `
  db.query(sql, function(err, result) {
    if (err) {
      res.send("Data insertion failed!");
      throw err;
    }
    console.log(result);
    res.send("Data successfully inserted..");
  });
});

app.listen(3000, function() {
  console.log("Server has started at port 3000.");
});

// app.get("/cr_tb_:tableName", function(req, res) {
//   var tableName = req.params.tableName;
//   var sql;
//
//   switch (tableName) {
//
//     // (사용자)address 테이블 생성 쿼리
//     case "address":
//       sql = `create table address (
//         address_id int unsigned not null auto_increment,
//         recipient varchar(30),
//         address varchar(100) not null,
//         city varchar(20),
//         state varchar(20),
//         zip char(5),
//         phone varchar(20),
//         primary key(address_id)
//       );`
//       break;
//
//       // member 테이블 생성 쿼리
//     case "member":
//       sql = `create table member (
//         user_id varchar(30) not null,
//         password varchar(200) not null,
//         fullname varchar(50) not null,
//         gender char(1),
//         birth date,
//         email varchar(50),
//         phone varchar(20),
//         s_money int,
//         creation_time timestamp default current_timestamp,
//         primary key(user_id)
//       );`
//       break;
//
//       // seller 테이블 생성 쿼리
//     case "seller":
//       sql = `create table seller (
//         seller_id varchar(30) not null,
//         name varchar(50) not null,
//         address varchar(100) not null,
//         phone varchar(20) not null,
//         email varchar(50) not null,
//         primary key(seller_id)
//       );`
//       break;
//
//       // product 테이블 생성 쿼리
//     case "product":
//       sql = `create table product (
//         product_id int unsigned not null auto_increment,
//         product varchar(100) not null,
//         type_avail varchar(100),
//         info text,
//         price int unsigned not null,
//         discount int(3) unsigned,
//         seller_id varchar(30) not null,
//         rating double unsigned,
//         category varchar(50),
//         qrcode varchar(200),
//         primary key(product_id),
//         foreign key(seller_id) references seller(seller_id) on delete cascade
//       );`
//       break;
//
//       // cart 테이블 생성 쿼리
//     case "cart":
//       sql = `create table cart (
//         cart_id int unsigned not null auto_increment,
//         user_id varchar(30) not null,
//         product_id int unsigned not null,
//         type varchar(50) not null,
//         quantity int(10) unsigned,
//         date date not null,
//         checked int(1),
//         primary key(cart_id),
//         foreign key(user_id) references member(user_id) on delete cascade,
//         foreign key(product_id) references product(product_id) on delete cascade
//       );`
//       break;
//
//       // wishlist 테이블 생성 쿼리
//     case "wishlist":
//       sql = `create table wishlist (
//         wishlist_id int unsigned not null auto_increment,
//         user_id varchar(30) not null,
//         product_id int unsigned not null,
//         date date not null,
//         primary key(wishlist_id),
//         foreign key(user_id) references member(user_id) on delete cascade,
//         foreign key(product_id) references product(product_id) on delete cascade
//       );`
//       break;
//
//       // coupon 테이블 생성 쿼리
//     case "coupon":
//       sql = `create table coupon (
//         coupon_code varchar(30) not null,
//         value int unsigned not null,
//         min_spend int unsigned not null,
//         effective_date date not null,
//         expiry_date date not null,
//         seller_id varchar(30) not null,
//         primary key(coupon_code),
//         foreign key(seller_id) references seller(seller_id) on delete cascade
//       );`
//       break;
//
//       // shop 테이블 생성 쿼리
//     case "shop":
//       sql = `create table shop (
//         shop_id int unsigned not null auto_increment,
//         shop varchar(50) not null,
//         address varchar(100) not null,
//         phone varchar(20) not null,
//         seller_id varchar(30) not null,
//         primary key(shop_id),
//         foreign key(seller_id) references seller(seller_id) on delete cascade
//       );`
//       break;
//
//       // stock 테이블 생성 쿼리
//     case "stock":
//       sql = `create table stock (
//         product_id int unsigned not null,
//         shop_id int unsigned not null,
//         quantity varchar(250) not null,
//         seller_id varchar(30) not null,
//         primary key(product_id, shop_id),
//         foreign key(product_id) references product(product_id) on delete cascade,
//         foreign key(shop_id) references shop(shop_id) on delete cascade,
//         foreign key(seller_id) references seller(seller_id) on delete cascade
//       );`
//       break;
//
//       // image 테이블 생성 쿼리
//     case "image":
//       sql = `create table image (
//         image_id int unsigned not null auto_increment,
//         file varchar(100) not null,
//         user_id varchar(30),
//     	  seller_id varchar(30),
//     	  product_id int unsigned,
//         primary key(image_id),
//         foreign key(product_id) references product(product_id) on delete cascade,
//         foreign key(user_id) references member(user_id) on delete cascade,
//         foreign key(seller_id) references seller(seller_id) on delete cascade
//       );`
//   }
//
//   db.query(sql, function(err, result) {
//     if (err) {
//       res.send("Table already exists or wrong query format! Restart the server to try again.");
//       throw err;
//     }
//     console.log(result);
//     res.send("Table created successfully..");
//   });
// });
