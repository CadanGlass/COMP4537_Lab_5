const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("hospital.db");

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

// Function to handle the insertion of multiple patients
function handleInsertPatients(req, res, body) {
  try {
    const patients = JSON.parse(body);
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
    console.error("Error processing insert patients:", error.message); // Enhanced logging
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON payload or data format." }));
  }
}
