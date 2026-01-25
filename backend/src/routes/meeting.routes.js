import { Router } from "express";
import { saveMeetingSummary } from "../controllers/meeting.controller.js";

const router = Router();

// POST /api/v1/meeting/save-summary
router.post("/save-summary", saveMeetingSummary);

export default router;
