require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./hospital.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("Error connecting to SQLite: " + err.message);
    return;
  }
  console.log("Connected to SQLite database.");
});

// Example query to fetch patients
db.all("SELECT * FROM patients", (err, rows) => {
  if (err) {
    throw err;
  }
  console.log(rows);
});

// Close the connection
db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Closed the database connection.");
});
