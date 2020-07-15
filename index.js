const express = require("express"); // Express.js package
const bodyParser = require("body-parser"); // body-parser package

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
})

app.listen(3000, function() {
  console.log("Server has started at port 3000.");
});
