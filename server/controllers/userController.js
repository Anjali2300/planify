const User = require("../models/user");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching users ❌" });
  }
};
