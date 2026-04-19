const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json()); // ✅ modern JSON parser

/* =========================
   EMPLOYEE LOGIN
========================= */
app.post("/login/employee", (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM employees WHERE username=? AND password=?";

    db.query(sql, [username, password], (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ success: false });
        }

        res.json({ success: result.length > 0 });
    });
});

/* =========================
   STUDENT LOGIN
========================= */
app.post("/login/student", (req, res) => {
    const { roll_no, password } = req.body;

    const sql = "SELECT * FROM students WHERE roll_no=? AND password=?";

    db.query(sql, [roll_no, password], (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ success: false });
        }

        res.json({ success: result.length > 0 });
    });
});

/* =========================
   GET STUDENTS BY SECTION
========================= */
app.get("/students", (req, res) => {
    const section = req.query.section;

    const sql = "SELECT id, roll_no, name, section FROM students WHERE section=?";

    db.query(sql, [section], (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ success: false });
        }

        res.json({ success: true, students: result });
    });
});

/* =========================
   SAVE ATTENDANCE
========================= */
app.post("/attendance", (req, res) => {

    const records = req.body.attendance;

    if (!records || records.length === 0) {
        return res.json({ success: false });
    }

    const sql = `
    INSERT INTO attendance 
    (student_id, roll_no, section, subject, date, period, status, topic)
    VALUES ?
    `;

    const values = records.map(r => [
        r.student_id,
        r.roll_no,
        r.section,
        r.subject,
        new Date(),
        r.period,
        r.status,
        r.topic
    ]);

    db.query(sql, [values], (err) => {
        if (err) {
            console.log(err);
            return res.json({ success: false });
        }
        res.json({ success: true });
    });
});

/* =========================
   STUDENT OVERALL ATTENDANCE
========================= */
app.get("/student-attendance", (req, res) => {
    const roll_no = req.query.roll_no;

    const sql = `
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) AS present
    FROM attendance
    WHERE roll_no = ?
    `;

    db.query(sql, [roll_no], (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ total: 0, present: 0, percent: 0 });
        }

        const total = result[0].total || 0;
        const present = result[0].present || 0;
        const percent = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

        res.json({ total, present, percent });
    });
});

/* =========================
   STUDENT SUBJECT-WISE ATTENDANCE
========================= */
app.get("/student-details", (req, res) => {
    const roll_no = req.query.roll_no;

    const sql = `
    SELECT subject,
           COUNT(*) AS total,
           SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) AS present
    FROM attendance
    WHERE roll_no = ?
    GROUP BY subject
    `;

    db.query(sql, [roll_no], (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ subjects: [] });
        }

        const subjects = result.map(r => ({
            subject: r.subject,
            total: r.total,
            present: r.present || 0,
            percent: ((r.present || 0) / r.total * 100).toFixed(2)
        }));

        res.json({ subjects });
    });
});

/* =========================
   TEST ROUTE
========================= */
app.get("/", (req, res) => {
    res.send("ECAP Backend Running 🚀");
});

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});