require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const authMiddleware = require("./middleware/auth");
const { isMember, isAdmin } = require("./config/helpers");

/* ================= DB CONNECTION ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log(err));

/* ================= TEST ROUTE ================= */
app.get("/", (req, res) => res.send("Planify API running 🚀"));

/* ================= REGISTER ================= */
/* ================= ROUTES (moved to routes/) ================= */
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/", authRoutes);
app.use("/", projectRoutes);
app.use("/", taskRoutes);
app.use("/", userRoutes);

/* ================= SERVER ================= */
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT} 🚀`);
});
