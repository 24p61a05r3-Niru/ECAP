const express = require("express");
const cors = require("cors");
const db = require("./db");

const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");

require("dotenv").config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   TEST ROUTE
========================= */
app.get("/", (req, res) => {
    res.send("ECAP Backend Running 🚀");
});

/* =========================
   EMPLOYEE LOGIN
========================= */
app.post("/login/employee", (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM employees WHERE username=? AND password=?";

    db.query(sql, [username, password], (err, result) => {
        if (err) {
            console.log("Employee Login Error:", err);
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
            console.log("Student Login Error:", err);
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
            console.log("Fetch Students Error:", err);
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
        new Date().toISOString().slice(0,10),
        r.period,
        r.status,
        r.topic
    ]);

    db.query(sql, [values], (err) => {
        if (err) {
            console.log("Attendance Save Error:", err);
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
            console.log("Attendance Summary Error:", err);
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
            console.log("Subject Details Error:", err);
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
   DOWNLOAD ATTENDANCE PDF
========================= */
app.get("/download-attendance", (req, res) => {

    const { section, date } = req.query;

    console.log("PDF Request:", section, date);

    const sql = `
        SELECT roll_no, subject, period, status, topic
        FROM attendance
        WHERE section=? AND date=?
    `;

    db.query(sql, [section, date], (err, results) => {

        if (err) {
            console.log("DB ERROR:", err);
            return res.status(500).send("Database error");
        }

        console.log("Query results:", results);

        const PDFDocument = require("pdfkit");
        const doc = new PDFDocument();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=attendance.pdf");

        doc.pipe(res);

        doc.fontSize(18).text("Daily Attendance Report", { align: "center" });
        doc.moveDown();

        doc.text(`Section: ${section}`);
        doc.text(`Date: ${date}`);
        doc.moveDown();

        if (!results || results.length === 0) {
            doc.text("No attendance records found for this date.");
        } else {
            results.forEach((r, i) => {
                doc.text(`${i + 1}. ${r.roll_no} | ${r.subject} | P${r.period} | ${r.status}`);
            });
        }

        doc.end();
    });
});
/* =========================
   SEND ATTENDANCE EMAIL
========================= */
app.post("/send-attendance-mail", async (req, res) => {

    const { email, section, date } = req.body;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS
        }
    });

    try {
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: "Daily Attendance Report",
            text: `Attendance report for Section ${section} on ${date}`,
            attachments: [
                {
                    filename: "attendance.pdf",
                    path: `${process.env.BASE_URL}/download-attendance?section=${section}&date=${date}`
                }
            ]
        });

        res.json({ success: true });

    } catch (err) {
        console.log("Mail Error:", err);
        res.json({ success: false });
    }
});

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.get("/test-db", (req, res) => {
    db.query("SELECT 1", (err, result) => {
        if (err) {
            console.log(err);
            return res.send("DB ERROR");
        }
        res.send("DB WORKING");
    });
});
