const mysql = require("mysql");
const database = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "Monksayang111988",
  database: "pirsoftpren",
});

module.exports = database;
