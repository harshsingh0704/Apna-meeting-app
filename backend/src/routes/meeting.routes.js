import { Router } from "express";
import {
  saveMeetingSummary,
  saveMeetingRecording,
} from "../controllers/meeting.controller.js";
import { getMeetingAnalytics } from "../controllers/analytics.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/v1/meeting/save-summary
router.post("/save-summary", auth, saveMeetingSummary);

// POST /api/v1/meeting/save-recording
router.post("/save-recording", auth, saveMeetingRecording);

// GET /api/v1/meeting/analytics/:meetingId
router.get("/analytics/:meetingId", auth, getMeetingAnalytics);

export default router;
