require("dotenv").config(); // Load environment variables from .env

const mysql = require("mysql2");

// Create a connection using environment variables
const connection = mysql.createConnection({
  host: process.env.DB_HOST, // MySQL host from .env
  user: process.env.DB_USER, // MySQL username from .env
  password: process.env.DB_PASSWORD, // MySQL password from .env
  database: process.env.DB_DATABASE, // MySQL database from .env
  port: process.env.DB_PORT || 3306, // MySQL port (defaults to 3306)
});

// Connect to the MySQL server
connection.connect((err) => {
  if (err) {
    console.error("Error connecting: " + err.stack);
    return;
  }
  console.log("Connected as id " + connection.threadId);
});

// Query the database (replace 'your_table' with the actual table name)
connection.query("SELECT * FROM patients", (err, results, fields) => {
  if (err) throw err;
  console.log(results); // Results from the query
});

// Close the connection
connection.end();
