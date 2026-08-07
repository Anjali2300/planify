const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { getAvatarUrl } = require("../config/helpers");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists ❌" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = getAvatarUrl(name);
    const user = new User({ name, email, password: hashedPassword, avatar });
    await user.save();
    res.status(201).json({ message: "User registered ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error ❌" });
  }
};

exports.login = async (req, res) => {
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
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({
      message: "Login successful ✅",
      token,
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error ❌" });
  }
};

exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found ❌" });
    }
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error ❌" });
  }
};
