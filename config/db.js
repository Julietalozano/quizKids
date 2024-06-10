const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "82.180.160.179",
  port: "3306", // Puerto de MySQL en MAMP 8889 3306
  user: "root",
  password: 'root',
  database: "quizkids",
});

connection.connect((error) => {
  if (error) throw error;
  console.log("Conectado exitosamente a la base de datos.");
});

module.exports = connection;
