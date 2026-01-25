import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema({
  user_id: { type: String, required: true },
  meetingCode: { type: String, required: true },
  date: { type: Date, default: Date.now, required: true },

  // ✅ AI Data
  meetingContext: { type: String, default: "" },
  summary: { type: String, default: "" },
  actionItems: { type: [String], default: [] },
});

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };
