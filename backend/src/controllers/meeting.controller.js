import { Meeting } from "../models/meeting.model.js";
import { User } from "../models/user.model.js";

export const saveMeetingSummary = async (req, res) => {
  try {
    const { token, meetingCode, meetingContext, summary, actionItems } = req.body;

    if (!token || !meetingCode) {
      return res.status(400).json({ message: "token and meetingCode required" });
    }

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // find meeting
    const meeting = await Meeting.findOne({
      user_id: user.username,
      meetingCode,
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found in history" });
    }

    meeting.meetingContext = meetingContext || meeting.meetingContext;
    meeting.summary = summary || meeting.summary;
    meeting.actionItems = actionItems || meeting.actionItems;

    await meeting.save();

    return res.status(200).json({
      message: "Meeting summary saved",
      meeting,
    });
  } catch (e) {
    return res.status(500).json({ message: `Something went wrong ${e}` });
  }
};
