const Task = require("../models/task");
const Project = require("../models/project");
const { isMember } = require("../config/helpers");

exports.createTask = async (req, res) => {
  try {
    const { title, projectId } = req.body;
    const project = await Project.findById(projectId);
    if (!project || !isMember(project, req.user.userId)) {
      return res.status(403).json({ message: "Not authorized ❌" });
    }
    const task = new Task({ title, projectId, userId: req.user.userId, status: "todo" });
    await task.save();
    res.status(201).json({ message: "Task created ✅", task });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error creating task ❌" });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project || !isMember(project, req.user.userId)) {
      return res.status(403).json({ message: "Not authorized ❌" });
    }
    const tasks = await Task.find({ projectId: req.params.projectId });
    res.json(tasks);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching tasks ❌" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found ❌" });
    }
    const project = await Project.findById(task.projectId);
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
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found ❌" });
    }
    const project = await Project.findById(task.projectId);
    if (!isMember(project, req.user.userId)) {
      return res.status(403).json({ message: "Not authorized ❌" });
    }
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error deleting task ❌" });
  }
};
