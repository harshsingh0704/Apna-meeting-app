import { Meeting } from "../models/meeting.model.js";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "with", "at", "by",
  "is", "are", "was", "were", "be", "been", "it", "this", "that", "we", "you", "i", "me",
  "my", "our", "your", "they", "them", "as", "from", "not", "no", "yes", "ok", "okay",
  "so", "if", "then", "when", "what", "how", "can", "will", "just", "have", "has", "had",
]);

/**
 * Parse meetingContext ( "Speaker: message\n..." ) into lines with speaker and text.
 */
function parseMeetingContext(meetingContext) {
  const raw = String(meetingContext || "").trim();
  if (!raw) return { lines: [], fullText: "" };

  const lines = [];
  const parts = raw.split(/\r?\n/g);

  for (const line of parts) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const idx = trimmed.indexOf(":");
    if (idx > 0 && idx < 60) {
      const speaker = trimmed.slice(0, idx).trim();
      const text = trimmed.slice(idx + 1).trim();
      if (speaker) {
        lines.push({ speaker, text });
      } else {
        lines.push({ speaker: "Unknown", text: trimmed });
      }
    } else {
      lines.push({ speaker: "Unknown", text: trimmed });
    }
  }

  const fullText = lines.map((l) => l.text).join(" ");
  return { lines, fullText };
}

/**
 * Speaker-wise metrics: message count and word count per speaker.
 */
function getSpeakerMetrics(lines) {
  const map = new Map(); // speaker -> { messageCount, wordCount }

  for (const { speaker, text } of lines) {
    const name = speaker || "Unknown";
    if (!map.has(name)) {
      map.set(name, { name, messageCount: 0, wordCount: 0 });
    }
    const entry = map.get(name);
    entry.messageCount += 1;
    const words = text.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    entry.wordCount += words.length;
  }

  return Array.from(map.values()).sort((a, b) => b.messageCount - a.messageCount);
}

/**
 * Engagement: bucket messages by position (quartiles) as proxy for "time" in meeting.
 */
function getEngagementBuckets(lines) {
  const total = lines.length;
  if (total === 0) {
    return [
      { bucket: "0-25%", label: "Start", count: 0 },
      { bucket: "25-50%", label: "Early mid", count: 0 },
      { bucket: "50-75%", label: "Late mid", count: 0 },
      { bucket: "75-100%", label: "End", count: 0 },
    ];
  }

  const q1 = Math.ceil(total * 0.25);
  const q2 = Math.ceil(total * 0.5);
  const q3 = Math.ceil(total * 0.75);

  const buckets = [
    { bucket: "0-25%", label: "Start", count: Math.min(q1, total) },
    { bucket: "25-50%", label: "Early mid", count: Math.min(q2 - q1, total) },
    { bucket: "50-75%", label: "Late mid", count: Math.min(q3 - q2, total) },
    { bucket: "75-100%", label: "End", count: Math.max(0, total - q3) },
  ];

  return buckets;
}

/**
 * Keyword trends: top N words by frequency (stopwords removed, min length 3).
 */
function getKeywordTrends(fullText, limit = 20) {
  const lower = fullText.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = lower.split(/\s+/).filter((t) => t.length >= 3 && !STOPWORDS.has(t));

  const freq = new Map();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

/**
 * GET /api/v1/meeting/analytics/:meetingId
 * Returns speakerMetrics, engagementBuckets, keywordTrends for the meeting.
 */
export const getMeetingAnalytics = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const username = req.user?.username;

    if (!meetingId || !username) {
      return res.status(400).json({ message: "meetingId required / Unauthorized" });
    }

    const meeting = await Meeting.findOne({
      _id: meetingId,
      user_id: username,
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const meetingContext = meeting.meetingContext || "";
    const { lines, fullText } = parseMeetingContext(meetingContext);

    const speakerMetrics = getSpeakerMetrics(lines);
    const engagementBuckets = getEngagementBuckets(lines);
    const keywordTrends = getKeywordTrends(fullText, 20);

    return res.status(200).json({
      meetingId: meeting._id,
      meetingCode: meeting.meetingCode,
      speakerMetrics,
      engagementBuckets,
      keywordTrends,
      totalMessages: lines.length,
    });
  } catch (e) {
    console.error("Analytics error:", e);
    return res.status(500).json({ message: "Analytics failed" });
  }
};
