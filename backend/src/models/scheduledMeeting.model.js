import mongoose, { Schema } from "mongoose";

const scheduledMeetingSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    meetingCode: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    attendees: [{ type: String }], // email addresses
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    googleEventId: { type: String, default: "" },
  },
  { timestamps: true }
);

const ScheduledMeeting = mongoose.model(
  "ScheduledMeeting",
  scheduledMeetingSchema
);

export { ScheduledMeeting };

