const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "todo"
  },
  projectId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Task", taskSchema);