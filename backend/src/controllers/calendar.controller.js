import { ScheduledMeeting } from "../models/scheduledMeeting.model.js";
import httpStatus from "http-status";

// Simple random code generator for scheduled meetings
const generateMeetingCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// POST /api/v1/calendar/schedule
export const scheduleMeeting = async (req, res) => {
  try {
    const { title, description, startTime, endTime, attendees = [] } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "title, startTime and endTime are required",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: "Invalid startTime or endTime" });
    }

    if (end <= start) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: "endTime must be after startTime" });
    }

    const meetingCode = generateMeetingCode();

    const meeting = await ScheduledMeeting.create({
      title,
      description,
      meetingCode,
      startTime: start,
      endTime: end,
      attendees,
      createdBy: req.user._id,
    });

    // 🔔 TODO (optional): integrate Google Calendar + email reminders here.
    // - Use googleapis with a service account or OAuth2.
    // - Use nodemailer for email notifications.

    return res.status(httpStatus.CREATED).json(meeting);
  } catch (error) {
    console.error("scheduleMeeting error:", error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to schedule meeting" });
  }
};

// GET /api/v1/calendar/my
export const getMyScheduledMeetings = async (req, res) => {
  try {
    const meetings = await ScheduledMeeting.find({
      createdBy: req.user._id,
    }).sort({ startTime: 1 });

    return res.status(httpStatus.OK).json(meetings);
  } catch (error) {
    console.error("getMyScheduledMeetings error:", error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to fetch scheduled meetings" });
  }
};

