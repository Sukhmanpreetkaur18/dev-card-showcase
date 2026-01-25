import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { protect } from "../middleware/auth.middleware.js";
import { sendMail } from "../utils/sendMail.js";

const router = express.Router();


router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    generateToken(res, user._id);

    
    await sendMail({
      to: email,
      subject: "Welcome to JustCoding 🚀",
      html: `
        <h2>Hello ${name},</h2>
        <p>Your account has been created successfully.</p>
        <p>You can now login securely using JWT Cookie authentication.</p>
        <br/>
        <b>– JustCoding Team</b>
      `
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    generateToken(res, user._id);


    await sendMail({
      to: email,
      subject: "Login Alert 🔐",
      html: `
        <p>You have successfully logged in.</p>
        <p>If this was not you, please secure your account immediately.</p>
      `
    });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});


router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});


router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json(user);
});

export default router;
