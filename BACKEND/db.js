console.log("Using Railway DB...");

const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// CONNECT TEST
db.connect((err) => {
    if (err) {
        console.log("❌ DB Connection Failed:", err);
    } else {
        console.log("✅ DB Connected to Railway");
    }
});

module.exports = db;
