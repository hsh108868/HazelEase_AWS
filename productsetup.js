

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

app.get("/insert_product", function(req, res) {
    var sql = `insert into product(product, info, cost, user_id, review, quantity, qrcode) values ?;`;
    var params = [
        ['test1', '1번 상품입니다.', '1500', 'pusrty', '3', '1', 'QRCode'],
        ['test2', '2번 상품입니다.', '3000', 'pusrty', '2.4', '2', 'QRCode'],
        ['test3', '3번 상품입니다.', '2000', 'pusrty', '4.5', '3', 'QRCode'],
        ['test4', '4번 상품입니다.', '3430', 'pusrty', '1.4', '4', 'QRCode'],
        ['test5', '5번 상품입니다.', '25000', 'pusrty', '3.4', '1', 'QRCode'],
        ['test6', '6번 상품입니다.', '49380', 'pusrty', '5', '6', 'QRCode']
    ];

    db.query(sql, [params], function(err, result) {
        if(err) {
            res.send("product error");
            throw err;
        } else {
            console.log(result);
        }
        res.send("product inserted");
    })
});

app.listen(3000, function() {
    console.log("Server has started at port 3000.");
});
/* 오류 발생시 product auto_increment 초기화
   alter table product auto_increment=1;
 */