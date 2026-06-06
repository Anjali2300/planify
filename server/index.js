require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const User = require("./models/user");
const Project = require("./models/project");
const Task = require("./models/task");

const app = express();
app.use(express.json());
app.use(cors());

/* ================= AUTH MIDDLEWARE ================= */
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied ❌" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    console.log("TOKEN ERROR:", err.message);
    res.status(401).json({ message: "Invalid token ❌" });
  }
};

/* ================= HELPERS ================= */
// members array stores objects: { userId, role }
// so we extract userId from each object before comparing

const isMember = (project, userId) => {
  return (
    project.userId.toString() === userId ||
    project.members.some((m) => m.userId.toString() === userId)
  );
};

const isAdmin = (project, userId) => {
  return (
    project.userId.toString() === userId ||
    project.members.some(
      (m) => m.userId.toString() === userId && m.role === "admin"
    )
  );
};

/* ================= DB CONNECTION ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log(err));

/* ================= TEST ROUTE ================= */
app.get("/", (req, res) => {
  res.send("Planify API running 🚀");
});

/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists ❌" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({ message: "User registered ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error ❌" });
  }
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found ❌" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password ❌" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ now returning user info along with token
    res.json({
      message: "Login successful ✅",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      }
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error ❌" });
  }
});
/* ================= PROFILE ================= */
app.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: "Welcome user " + req.user.userId });
});

/* ================= CREATE PROJECT ================= */
app.post("/projects", authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;

    const project = new Project({
      title,
      userId: req.user.userId,
      members: [
        {
          userId: req.user.userId,
          role: "admin", // creator is always admin
        },
      ],
    });

    await project.save();

    res.status(201).json({ message: "Project created ✅", project });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error creating project ❌" });
  }
});

/* ================= GET PROJECTS ================= */
app.get("/projects", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { userId: req.user.userId },
        { "members.userId": req.user.userId }, // ✅ query nested userId inside members
      ],
    });

    res.json(projects);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching projects ❌" });
  }
});
/* ================= PROFILE ================= */
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= DELETE PROJECT ================= */
app.delete("/projects/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found ❌" });
    }

    // only admin can delete
    if (!isAdmin(project, req.user.userId)) {
      return res.status(403).json({ message: "Only admin can delete ❌" });
    }

    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ projectId: req.params.id }); // delete all tasks too

    res.json({ message: "Project deleted ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error deleting project ❌" });
  }
});

/* ================= INVITE USER TO PROJECT ================= */
app.post("/projects/invite", authMiddleware, async (req, res) => {
  try {
    const { projectId, email } = req.body;

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found ❌" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found ❌" });
    }

    // only admin can invite
    if (!isAdmin(project, req.user.userId)) {
      return res.status(403).json({ message: "Only admin can invite ❌" });
    }

    // avoid duplicate members ✅ using .toString() for correct comparison
    const alreadyMember = project.members.some(
      (m) => m.userId.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: "User already a member ❌" });
    }

    project.members.push({
      userId: userToAdd._id,
      role: "member",
    });

    await project.save();

    res.json({ message: "User invited ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error inviting user ❌" });
  }
});

/* ================= CREATE TASK ================= */
app.post("/tasks", authMiddleware, async (req, res) => {
  try {
    const { title, projectId } = req.body;

    const project = await Project.findById(projectId);

    // ✅ using isMember helper — handles nested { userId, role } objects
    if (!project || !isMember(project, req.user.userId)) {
      return res.status(403).json({ message: "Not authorized ❌" });
    }

    const task = new Task({
      title,
      projectId,
      userId: req.user.userId,
      status: "todo",
    });

    await task.save();

    res.status(201).json({ message: "Task created ✅", task });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error creating task ❌" });
  }
});

/* ================= GET TASKS ================= */
app.get("/tasks/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    // ✅ using isMember helper
    if (!project || !isMember(project, req.user.userId)) {
      return res.status(403).json({ message: "Not authorized ❌" });
    }

    const tasks = await Task.find({ projectId: req.params.projectId });

    res.json(tasks);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching tasks ❌" });
  }
});

/* ================= UPDATE TASK ================= */
app.put("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found ❌" });
    }

    const project = await Project.findById(task.projectId);

    // ✅ using isMember helper
    if (!isMember(project, req.user.userId)) {
      return res.status(403).json({ message: "Not authorized ❌" });
    }

    task.status = status;
    await task.save();

    res.json({ message: "Task updated ✅", task });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error updating task ❌" });
  }
});

/* ================= DELETE TASK ================= */
app.delete("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found ❌" });
    }

    const project = await Project.findById(task.projectId);

    // ✅ using isMember helper
    if (!isMember(project, req.user.userId)) {
      return res.status(403).json({ message: "Not authorized ❌" });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: "Task deleted ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error deleting task ❌" });
  }
});

/* ================= GET ALL USERS ================= */
app.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password"); // removes password field

    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching users ❌" });
  }
});

/* ================= SERVER ================= */
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT} 🚀`);
});