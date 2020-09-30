var mysql = require('mysql');

var db   = mysql.createConnection({
   host     : "localhost",
  user     : "root",
   password : "",
   database : "hazelease",
   multipleStatements: true
 });

/*var db   = mysql.createConnection({
  connectionLimit    : 10,
  host               : "db4free.net",
  port               : 3306,
  user               : "hazelease",
  password           : "#hazelease123#",
  database           : "hazelease",
  multipleStatements : true
});*/


module.exports = {
  db: db
}
