// Load environment variables
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./db/connection");
const { initDb } = require("./db/schema");

const authRoutes = require("./routes/auth");
const electionsRoutes = require("./routes/elections");
const votesRoutes = require("./routes/votes");

const app = express();

// Azure port
const PORT = process.env.PORT || 8080;

/* -------------------- Middleware -------------------- */

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

app.use(express.json());

/* -------------------- API Routes -------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/elections", electionsRoutes);
app.use("/api/votes", votesRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Voting API running" });
});

/* -------------------- Serve Frontend -------------------- */

const frontendPath = path.join(__dirname, "../frontend");

app.use(express.static(frontendPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* -------------------- Email Test Route -------------------- */

app.get("/api/test-email", async (req, res) => {
  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      return res.status(500).json({
        error: "SMTP credentials missing",
        SMTP_USER: smtpUser ? "SET" : "MISSING",
        SMTP_PASS: smtpPass ? "SET" : "MISSING"
      });
    }

    const { getTransporter } = require("./services/email");
    const transporter = getTransporter();

    await transporter.verify();

    res.json({
      success: true,
      message: "SMTP configuration verified"
    });

  } catch (error) {
    res.status(500).json({
      error: "Email verification failed",
      message: error.message
    });
  }
});

/* -------------------- Start Server -------------------- */

async function startServer() {
  try {

    await connectDB();
    console.log("✅ MongoDB Connected");

    await initDb();
    console.log("✅ Database Initialized");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check: /api/health`);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
