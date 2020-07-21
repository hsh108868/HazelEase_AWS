var mysql = require('mysql');

var db   = mysql.createConnection({
  host     : "localhost",
  user     : "root",
  password : "",
  database : "hazelease"
});

module.exports = {
  db: db
}
