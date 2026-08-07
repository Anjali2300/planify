const Project = require("../models/project");
const Task = require("../models/task");
const User = require("../models/user");
const { isMember, isAdmin } = require("../config/helpers");

exports.createProject = async (req, res) => {
  try {
    const { title } = req.body;
    const project = new Project({
      title,
      userId: req.user.userId,
      members: [{ userId: req.user.userId, role: "admin" }],
    });
    await project.save();
    res.status(201).json({ message: "Project created ✅", project });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error creating project ❌" });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ userId: req.user.userId }, { "members.userId": req.user.userId }],
    });
    res.json(projects);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching projects ❌" });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || !isMember(project, req.user.userId)) {
      return res.status(403).json({ message: "Not authorized ❌" });
    }
    const memberDetails = await Promise.all(
      project.members.map(async (m) => {
        const user = await User.findById(m.userId).select("-password");
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: m.role,
        };
      })
    );
    res.json({ _id: project._id, title: project.title, userId: project.userId, members: memberDetails });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error ❌" });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found ❌" });
    }
    if (!isAdmin(project, req.user.userId)) {
      return res.status(403).json({ message: "Only admin can delete ❌" });
    }
    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ projectId: req.params.id });
    res.json({ message: "Project deleted ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error deleting project ❌" });
  }
};

exports.invite = async (req, res) => {
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
    if (!isAdmin(project, req.user.userId)) {
      return res.status(403).json({ message: "Only admin can invite ❌" });
    }
    const alreadyMember = project.members.some((m) => m.userId.toString() === userToAdd._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ message: "User already a member ❌" });
    }
    project.members.push({ userId: userToAdd._id, role: "member" });
    await project.save();
    res.json({ message: "User invited ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error inviting user ❌" });
  }
};
