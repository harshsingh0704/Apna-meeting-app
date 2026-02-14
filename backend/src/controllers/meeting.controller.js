import { Meeting } from "../models/meeting.model.js";

// ✅ Save AI-generated meeting summary & tasks
export const saveMeetingSummary = async (req, res) => {
  console.log("🔥 /api/v1/meeting/save-summary HIT");
  console.log("BODY =>", req.body);

  try {
    const { meetingCode, meetingContext, summary, actionItems, decisions } = req.body;

    if (!meetingCode) {
      return res.status(400).json({ message: "meetingCode required" });
    }

    // `auth` middleware has already validated the token and set `req.user`
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // find latest meeting for this user + code
    const meeting = await Meeting.findOne({
      user_id: username,
      meetingCode,
    }).sort({ date: -1 });

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

    // ✅ decisions (same handling as actionItems)
    let fixedDecisions = [];
    if (Array.isArray(decisions)) {
      fixedDecisions = decisions.length === 1 && decisions[0] === "[]" ? [] : decisions;
    } else if (typeof decisions === "string") {
      try {
        const parsed = JSON.parse(decisions);
        fixedDecisions = Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        fixedDecisions = meeting.decisions || [];
      }
    } else {
      fixedDecisions = meeting.decisions || [];
    }
    meeting.decisions = fixedDecisions;

    await meeting.save();

    return res.status(200).json({
      message: "Meeting summary saved",
      meeting,
    });
  } catch (e) {
    return res.status(500).json({ message: `Something went wrong ${e}` });
  }
};

// ✅ Save meeting recording metadata (URL + duration)
export const saveMeetingRecording = async (req, res) => {
  console.log("🔥 /api/v1/meeting/save-recording HIT");
  console.log("BODY =>", req.body);

  try {
    const { meetingCode, recordingUrl, recordingDuration } = req.body;

    if (!meetingCode || !recordingUrl) {
      return res
        .status(400)
        .json({ message: "meetingCode and recordingUrl are required" });
    }

    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const meeting = await Meeting.findOne({
      user_id: username,
      meetingCode,
    }).sort({ date: -1 });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found in history" });
    }

    meeting.recordingUrl = recordingUrl;
    meeting.recordingDuration =
      typeof recordingDuration === "number" ? recordingDuration : 0;

    await meeting.save();

    return res.status(200).json({
      message: "Meeting recording saved",
      meeting,
    });
  } catch (e) {
    return res.status(500).json({ message: `Something went wrong ${e}` });
  }
};
