console.log("Using Railway DB...");
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "roundhouse.proxy.rlwy.net",
    user: "root",
    password: "qswxgDRWJedHxrovHRjUfwwplLGfajUQ",
    database: "railway",
    port: 44292
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