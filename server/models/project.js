const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },

  // 👇 NEW FIELD
  members: [
    {
      userId: String,
      role: {
        type: String,
        enum: ["admin", "member"],
        default: "member"
      }
    }
  ]
});

module.exports = mongoose.model("Project", projectSchema);