const express = require("express"); // Express.js package
const bodyParser = require("body-parser"); // body-parser package
const ejs = require("ejs"); // Ejs package

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res) {
  res.render("home", {});
})

app.get("/account", function(req, res) {
  res.render("account", {});
})

app.get("/login", function(req, res){
  res.render("login", {});
})

app.get("/signup", function(req, res){
  res.render("signup", {});
})

app.listen(3000, function() {
  console.log("Server has started at port 3000.");
});
