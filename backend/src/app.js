const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const courtRoutes = require("./routes/courtRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const matchRoutes = require("./routes/matchRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");
const userRoutes = require("./routes/userRoutes");

const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "AGU Tennis Platform API is running"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is healthy"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/users", userRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
