require("dotenv").config();
const http = require("http");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors"); // Import cors package
const express = require("express");
const app = express();

const db = new sqlite3.Database("hospital.db");

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to handle CORS
app.use(cors()); // Apply CORS middleware

// Function to create the table if it doesn't exist
function createPatientsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dateOfBirth TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.run(createTableQuery, (err) => {
    if (err) {
      console.error("Error creating table:", err.message);
    } else {
      console.log("Table 'patients' is ready or already exists.");
    }
  });
}

// Call the function to ensure the table is created when the application starts
createPatientsTable();

// Route to handle POST request for inserting multiple rows
app.post("/insert-patients", (req, res) => {
  const body = req.body;
  try {
    const patients = body;
    if (!Array.isArray(patients)) {
      throw new Error("Payload must be an array of patients.");
    }
    const values = patients.map((patient) => [
      patient.name,
      patient.dateOfBirth,
    ]);
    const placeholders = values.map(() => "(?, ?)").join(", ");
    const query = `INSERT INTO patients (name, dateOfBirth) VALUES ${placeholders}`;

    db.run(query, values.flat(), function (err) {
      if (err) {
        console.error("Database query failed:", err.message); // Enhanced logging
        return res.status(500).json({ error: "Database query failed" });
      }
      res.status(201).json({
        message: `Inserted ${this.changes} patients successfully`,
      });
    });
  } catch (error) {
    console.error("Error processing insert patients:", error.message); // Enhanced logging
    res.status(400).json({ error: "Invalid JSON payload or data format." });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
