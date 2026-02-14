import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  scheduleMeeting,
  getMyScheduledMeetings,
} from "../controllers/calendar.controller.js";

const router = Router();

// Schedule a new meeting
router.post("/schedule", auth, scheduleMeeting);

// Get meetings created by current user
router.get("/my", auth, getMyScheduledMeetings);

export default router;

