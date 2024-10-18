require("dotenv").config();
const http = require("http");
const mysql = require("mysql2");
const cors = require("cors"); // Import cors package

// MySQL connection setup
const connection = mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "your_password",
  database: process.env.DB_DATABASE || "hospital",
  port: process.env.DB_PORT || 3306,
});

// Connect to MySQL and create table if it doesn't exist
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as id " + connection.threadId);

  // Create the patients table if it does not exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS patients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      dateOfBirth DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  connection.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("Error creating table: " + err.stack);
    } else {
      console.log("Table 'patients' is ready");
    }
  });
});

// Function to set CORS headers manually
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // Allow these methods
  res.setHeader("Access-Control-Allow-Headers", "Content-Type"); // Allow specific headers
}

// Function to handle POST request for inserting multiple rows
function handleInsertPatients(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const patients = JSON.parse(body);

      // Construct the query for inserting multiple rows
      const values = patients.map((patient) => [
        patient.name,
        patient.dateOfBirth,
      ]);
      const query = "INSERT INTO patients (name, dateOfBirth) VALUES ?";

      // Insert multiple rows into the database
      connection.query(query, [values], (err, result) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Database query failed" }));
        }

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: `Inserted ${result.affectedRows} patients successfully`,
          })
        );
      });
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid JSON data" }));
    }
  });
}

// Create HTTP server to listen for requests
const server = http.createServer((req, res) => {
  // Handle OPTIONS preflight request for CORS
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.writeHead(204); // No Content response for OPTIONS
    return res.end();
  }

  setCorsHeaders(res); // Set CORS headers for all requests

  if (req.method === "POST" && req.url === "/insert-patients") {
    handleInsertPatients(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Not Found" }));
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
