import { Meeting } from "../models/meeting.model.js";
import { User } from "../models/user.model.js";

export const saveMeetingSummary = async (req, res) => {
  console.log("🔥 /api/v1/meeting/save-summary HIT");
  console.log("BODY =>", req.body);

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
}).sort({ date: -1 }); // ✅ latest meeting pick


    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found in history" });
    }

    // ✅ Update meeting data
    meeting.meetingContext = meetingContext || meeting.meetingContext;
    meeting.summary = summary || meeting.summary;

    // ✅ actionItems fix (handles ["[]"], "[]", array)
    let fixedActionItems = [];

    if (Array.isArray(actionItems)) {
      // case: ["[]"] -> treat as empty
      if (actionItems.length === 1 && actionItems[0] === "[]") {
        fixedActionItems = [];
      } else {
        fixedActionItems = actionItems;
      }
    } else if (typeof actionItems === "string") {
      // case: "[]"
      try {
        const parsed = JSON.parse(actionItems);
        fixedActionItems = Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        fixedActionItems = [];
      }
    } else {
      fixedActionItems = meeting.actionItems || [];
    }

    meeting.actionItems = fixedActionItems;

    await meeting.save();

    return res.status(200).json({
      message: "Meeting summary saved",
      meeting,
    });
  } catch (e) {
    return res.status(500).json({ message: `Something went wrong ${e}` });
  }
};
