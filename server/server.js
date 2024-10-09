require("dotenv").config();
const http = require("http");
const mysql = require("mysql2");
const cors = require("cors");

// MySQL connection setup
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 1433, // Azure SQL uses 1433 port
});

// Connect to Azure MySQL Database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to Azure MySQL Database.");
});

// Function to set CORS headers
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
      const query = "INSERT INTO Patients (name, dateOfBirth) VALUES ?";

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
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.writeHead(204);
    return res.end();
  }

  setCorsHeaders(res);

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
