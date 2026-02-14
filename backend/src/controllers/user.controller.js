import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Meeting } from "../models/meeting.model.js";
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Please provide username and password" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User Not Found" });
    }

    let isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (isPasswordCorrect) {
      const token = jwt.sign(
        { userId: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      
      // Do not save the token in the user object
      // await user.save();

      const userResponse = {
        _id: user._id,
        name: user.name,
        username: user.username
      }

      return res.status(httpStatus.OK).json({ token: token, user: userResponse });
    } else {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid Username or password" });
    }
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong` });
  }
};




const register = async (req, res) => {
  const { name, username, password } = req.body;

  // ✅ validation
  if (!name || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // ✅ check existing user
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // ✅ hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ create user
    const newUser = new User({
      name: name,
      username: username,
      password: hashedPassword
    });

    await newUser.save();

    return res.status(201).json({ message: "User Registered Successfully" });

  } catch (e) {
    console.error("REGISTER ERROR:", e);
    return res.status(500).json({ message: e.message });
  }
};






const getUserHistory = async (req, res) => {
  try {
    const meetings = await Meeting.find({ user_id: req.user.username }).sort({ date: -1 });
    res.json(meetings);
  } catch (e) {
    res.status(500).json({ message: `Something went wrong ${e}` });
  }
};


const addToHistory = async (req, res) => {
  const { meeting_code } = req.body;

  try {
    // ✅ prevent duplicate meeting code for same user
    const existing = await Meeting.findOne({
      user_id: req.user.username,
      meetingCode: meeting_code,
    });

    if (existing) {
      return res.status(200).json({ message: "Meeting already exists in history" });
    }

    const newMeeting = new Meeting({
      user_id: req.user.username,   // ✅ always current logged in user
      meetingCode: meeting_code,
    });

    await newMeeting.save();

    res.status(201).json({ message: "Added code to history" });
  } catch (e) {
    res.status(500).json({ message: `Something went wrong ${e}` });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "_id username");
    res.status(200).json(users);
  } catch (e) {
    res.status(500).json({ message: `Something went wrong ${e}` });
  }
};




export { login, register, getUserHistory, addToHistory, getAllUsers }