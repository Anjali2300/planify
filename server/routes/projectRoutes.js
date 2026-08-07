const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const authMiddleware = require("../middleware/auth");

router.post("/projects", authMiddleware, projectController.createProject);
router.get("/projects", authMiddleware, projectController.getProjects);
router.get("/projects/:id", authMiddleware, projectController.getProject);
router.delete("/projects/:id", authMiddleware, projectController.deleteProject);
router.post("/projects/invite", authMiddleware, projectController.invite);

module.exports = router;
