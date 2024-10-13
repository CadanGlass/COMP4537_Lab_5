require("dotenv").config();
const http = require("http");
const sqlite3 = require("sqlite3").verbose();
const url = require("url");

// SQLite connection setup
const db = new sqlite3.Database(
  "./hospital.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error("Error connecting to SQLite: " + err.message);
      return;
    }
    console.log("Connected to SQLite database.");
  }
);

// Function to set CORS headers manually
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Or set to your Netlify URL
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Update the POST endpoints to include the base path
const BASE_PATH = "/app2/lab5";

const server = http.createServer((req, res) => {
  // Set CORS headers for all requests
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    // Handle preflight request
    res.writeHead(204); // No content for preflight requests
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (req.method === "GET" && pathname.startsWith(`${BASE_PATH}/api/v1/sql/`)) {
    // Handle GET SQL queries
    const sqlQuery = decodeURIComponent(
      pathname.replace(`${BASE_PATH}/api/v1/sql/`, "")
    );
    if (sqlQuery.trim().toLowerCase().startsWith("select")) {
      handleSqlGetQuery(req, res, sqlQuery);
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: "Only SELECT queries are allowed via GET." })
      );
    }
  } else if (req.method === "POST" && pathname === `${BASE_PATH}/sql-query`) {
    // Handle POST SQL queries (SELECT or INSERT)
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      const { query } = JSON.parse(body);
      handleSqlPostQuery(req, res, query);
    });
  } else if (req.method === "POST" && pathname === `${BASE_PATH}/insert-patients`) {
    // Handle POST request for inserting multiple patients
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      handleInsertPatients(req, res, body);
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Not Found" }));
  }
});

// Function to handle SQL SELECT queries via GET
function handleSqlGetQuery(req, res, query) {
  db.all(query, [], (err, rows) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Database query failed" }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(rows));
  });
}

// Function to handle SQL INSERT or SELECT queries via POST
function handleSqlPostQuery(req, res, query) {
  if (query.trim().toLowerCase().startsWith("select")) {
    db.all(query, [], (err, rows) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Database query failed" }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(rows));
    });
  } else if (query.trim().toLowerCase().startsWith("insert")) {
    db.run(query, function (err) {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Database query failed" }));
      }
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: `Inserted ${this.changes} rows successfully`,
        })
      );
    });
  } else {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Only SELECT and INSERT queries are allowed via POST.",
      })
    );
  }
}

// Function to handle the insertion of multiple patients
function handleInsertPatients(req, res, body) {
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
}

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
