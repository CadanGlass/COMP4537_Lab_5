require("dotenv").config();
const http = require("http");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

// SQLite connection setup
const db = new sqlite3.Database("./hospital.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("Error connecting to SQLite: " + err.message);
    return;
  }
  console.log("Connected to SQLite database.");
});

// Function to set CORS headers manually
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

      const values = patients.map((patient) => [patient.name, patient.dateOfBirth]);

      const placeholders = values.map(() => "(?, ?)").join(", ");
      const query = `INSERT INTO patients (name, dateOfBirth) VALUES ${placeholders}`;

      db.run(query, values.flat(), function (err) {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Database query failed" }));
        }

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: `Inserted ${this.changes} patients successfully`,
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
