console.log("Using Railway DB...");

const mysql = require("mysql2");

const db = mysql.createConnection(process.env.DATABASE_URL);

db.connect((err) => {
    if (err) {
        console.log("❌ DB Connection Failed:", err);
    } else {
        console.log("✅ DB Connected to Railway");
    }
});

module.exports = db;
