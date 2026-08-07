const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/auth");

router.post("/tasks", authMiddleware, taskController.createTask);
router.get("/tasks/:projectId", authMiddleware, taskController.getTasks);
router.put("/tasks/:id", authMiddleware, taskController.updateTask);
router.delete("/tasks/:id", authMiddleware, taskController.deleteTask);

module.exports = router;
