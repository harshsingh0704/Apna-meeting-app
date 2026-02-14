import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import httpStatus from "http-status";

const auth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.userId).select("-password");

      next();
      return;
    } catch (error) {
      res.status(httpStatus.UNAUTHORIZED).json({ message: "Not authorized, token failed" });
      return;
    }
  }

  if (!token) {
    res.status(httpStatus.UNAUTHORIZED).json({ message: "Not authorized, no token" });
  }
};

export { auth };