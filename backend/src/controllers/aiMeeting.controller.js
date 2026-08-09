import Groq from "groq-sdk";

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "at",
  "by",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "it",
  "this",
  "that",
  "we",
  "you",
  "i",
  "me",
  "my",
  "our",
  "your",
  "they",
  "them",
  "as",
  "from",
  "not",
  "no",
  "yes",
  "ok",
  "okay",
]);

function isInsufficientQuotaError(error) {
  const status = error?.status ?? error?.response?.status;
  const code = error?.code ?? error?.error?.code ?? error?.response?.data?.error?.code;
  const type = error?.type ?? error?.error?.type ?? error?.response?.data?.error?.type;
  return status === 429 || code === "insufficient_quota" || type === "insufficient_quota";
}

function localSummarize(meetingContext) {
  const lines = String(meetingContext || "")
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean);

  const speakers = new Set();
  const words = new Map();
  const actionCandidates = [];
  const decisionCandidates = [];

  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx > 0 && idx < 40) {
      const speaker = line.slice(0, idx).trim();
      if (speaker) speakers.add(speaker);
    }

    const lower = line.toLowerCase();
    if (
      lower.includes("todo") ||
      lower.includes("task") ||
      lower.includes("action item") ||
      lower.includes("please") ||
      lower.includes("need to") ||
      lower.includes("we should") ||
      lower.includes("we will")
    ) {
      actionCandidates.push(line);
    }
    if (
      lower.includes("decided") ||
      lower.includes("decision") ||
      lower.includes("agreed") ||
      lower.includes("approved") ||
      lower.includes("we decided") ||
      lower.includes("we agreed")
    ) {
      decisionCandidates.push(line);
    }

    const tokens = lower
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/g)
      .filter((t) => t.length >= 4 && !STOPWORDS.has(t));
    for (const t of tokens) {
      words.set(t, (words.get(t) || 0) + 1);
    }
  }

  const topTopics = [...words.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  const recent = lines.slice(-8);
  const tasks = actionCandidates
    .slice(0, 8)
    .map((l) => l.replace(/^[^-:]+:\s*/, "").trim())
    .filter(Boolean)
    .map((t) => (t.length > 140 ? `${t.slice(0, 140)}…` : t));

  const decisions = decisionCandidates
    .slice(0, 8)
    .map((l) => l.replace(/^[^-:]+:\s*/, "").trim())
    .filter(Boolean)
    .map((t) => (t.length > 140 ? `${t.slice(0, 140)}…` : t));

  const summaryLines = [
    `- Participants: ${speakers.size > 0 ? [...speakers].join(", ") : "Unknown"}`,
    `- Messages captured: ${lines.length}`,
    `- Key topics: ${topTopics.length ? topTopics.join(", ") : "N/A"}`,
  ];

  if (recent.length) {
    summaryLines.push(`- Recent context: ${recent.join(" | ").slice(0, 280)}${recent.join(" | ").length > 280 ? "…" : ""}`);
  }

  const summary = `SUMMARY:\n${summaryLines.join("\n")}\n\nTASKS:\n${
    tasks.length ? tasks.map((t) => `- ${t}`).join("\n") : "- No clear action items detected."
  }\n\nDECISIONS:\n${
    decisions.length ? decisions.map((d) => `- ${d}`).join("\n") : "- No clear decisions detected."
  }`;

  return { summary, tasks, decisions };
}

const DECISION_PATTERNS = [
  /\bdecided\b/,
  /\bdecision\b/,
  /\bagreed\b/,
  /\bapproved\b/,
  /\baccepted\b/,
  /\bno objections\b/,
  /\ball in favor\b/,
  /\blet(?:'s| us)\b/,
  /\bwe should\b/,
  /\bwe will\b/,
  /\bgoing to\b/,
];

function parseTimestampFromLine(line) {
  const match = line.match(/^\s*\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*/);
  return match ? match[1] : null;
}

function parseSpeakerFromLine(line) {
  const speakerMatch = line.match(/^([^:\n]{1,40}):\s*(.*)$/);
  return speakerMatch ? { speaker: speakerMatch[1].trim(), text: speakerMatch[2].trim() } : { speaker: null, text: line.trim() };
}

function estimateDecisionConfidence(text) {
  let score = 0.3;
  if (/\bdecided\b/.test(text)) score += 0.35;
  if (/\bagreed\b/.test(text)) score += 0.25;
  if (/\bapproved\b/.test(text)) score += 0.25;
  if (/\bno objections\b/.test(text)) score += 0.15;
  if (/\bdecision\b/.test(text)) score += 0.15;
  if (/\bwe (?:should|will|must)\b/.test(text)) score += 0.12;
  if (/\blet(?:'s| us)\b/.test(text)) score += 0.1;
  if (/\bgoing to\b/.test(text)) score += 0.08;
  if (/\baccept(?:ed)?\b/.test(text)) score += 0.15;
  return Math.min(0.98, score);
}

function parseAgreedBy(speaker, text) {
  const lower = text.toLowerCase();
  if (speaker) return speaker;
  if (/\ball (?:in favor|agreed|approved)\b/.test(lower)) return "All participants";
  if (/\beveryone agreed\b/.test(lower)) return "All participants";
  if (/\bwe (?:should|will|must|agree|decide)\b/.test(lower)) return "Team";
  if (/\bI agree\b/.test(lower)) return "Unspecified speaker";
  return "Unknown";
}

function parseDecisionStatement(text) {
  return text.replace(/^[-*]+\s*/g, "").trim();
}

const ACTION_PATTERNS = [
  /todo/,
  /task/,
  /action item/,
  /please/,
  /need to/,
  /we should/,
  /we will/,
  /assign/,
  /follow up/,
  /schedule/,
  /remind/,
  /should be/,
];

function parseTaskDeadline(text) {
  const deadlineMatch = text.match(/\b(?:by|before|until|due on|due by)\s+([^.,;]+)/i);
  if (deadlineMatch) {
    return deadlineMatch[1].trim();
  }
  const dateMatch = text.match(/\b(?:on\s+[A-Za-z]+\s+\d{1,2}|tomorrow|today|next week|next month|this week|end of week|Friday|Monday|Tuesday|Wednesday|Thursday|Saturday|Sunday)\b/i);
  return dateMatch ? dateMatch[0].trim() : null;
}

function parseTaskPriority(text) {
  const lower = text.toLowerCase();
  if (/(urgent|asap|high priority|critical|important|immediately)/.test(lower)) return "High";
  if (/(low priority|whenever|later|not urgent|can wait)/.test(lower)) return "Low";
  return "Medium";
}

function parseTaskAssignedTo(speaker, text) {
  const assignedMatch = text.match(/\b(?:assigned to|for|by|with)\s+([A-Z][a-z]+)\b/i);
  if (assignedMatch) return assignedMatch[1];

  const willMatch = text.match(/\b([A-Z][a-z]+)\s+(?:will|can|should|needs?)\b/i);
  if (willMatch) return willMatch[1];

  if (speaker && /\b(i|i'll|i will|i can|i am|i'm)\b/i.test(text)) {
    return speaker;
  }

  if (speaker && /\b(please|kindly|let's|lets|we should|we will)\b/i.test(text)) {
    return speaker;
  }

  const mentionMatch = text.match(/^([A-Z][a-z]+):/);
  if (mentionMatch) return mentionMatch[1];

  return "Unassigned";
}

function parseTaskTitle(text) {
  return text
    .replace(/^[-*]+\s*/g, "")
    .replace(/^task[:\s-]*/i, "")
    .replace(/^todo[:\s-]*/i, "")
    .replace(/^action item[:\s-]*/i, "")
    .replace(/\b(please|kindly)\b/gi, "")
    .replace(/\b(?:by|before|until|due on|due by)\s+[^.,;]+/gi, "")
    .replace(/\b(?:urgent|asap|high priority|low priority|important)\b/gi, "")
    .trim();
}

function localExtractActionItems(meetingContext) {
  const lines = String(meetingContext || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const actionItems = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!ACTION_PATTERNS.some((pattern) => pattern.test(lower))) continue;

    const timestamp = parseTimestampFromLine(line);
    const cleanedLine = timestamp ? line.replace(/^\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/, "").trim() : line;
    const { speaker, text } = parseSpeakerFromLine(cleanedLine);
    const statement = parseDecisionStatement(text);
    if (!statement) continue;

    actionItems.push({
      taskTitle: parseTaskTitle(statement),
      assignedTo: parseTaskAssignedTo(speaker, statement),
      deadline: parseTaskDeadline(statement),
      priority: parseTaskPriority(statement),
      sourceLine: speaker ? `${speaker}: ${statement}` : statement,
      timestamp,
    });
  }

  return actionItems.slice(0, 12);
}

function localDetectDecisions(meetingContext) {
  const lines = String(meetingContext || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const decisions = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!DECISION_PATTERNS.some((pattern) => pattern.test(lower))) continue;

    const timestamp = parseTimestampFromLine(line);
    const cleanedLine = timestamp ? line.replace(/^\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/, "").trim() : line;
    const { speaker, text } = parseSpeakerFromLine(cleanedLine);
    const statement = parseDecisionStatement(text);

    if (!statement) continue;

    decisions.push({
      statement,
      agreedBy: parseAgreedBy(speaker, text),
      confidence: Number(estimateDecisionConfidence(lower).toFixed(2)),
      timestamp,
    });
  }

  return decisions.slice(0, 12);
}

const CONFUSION_PATTERNS = [
  /\bnot sure\b/,
  /\bunclear\b/,
  /\bconfusing\b/,
  /\bconfusion\b/,
  /\bi don't understand\b/,
  /\bcan't tell\b/,
  /\bneed clarification\b/,
  /\bplease clarify\b/,
  /\bnot clear\b/,
];

const DISAGREEMENT_PATTERNS = [
  /\bi disagree\b/,
  /\bnot agree\b/,
  /\bthat's wrong\b/,
  /\bno\b.*\bagree\b/,
  /\bi don't think\b/,
  /\bhowever\b/,
  /\bbut\b.*\bnot\b/,
  /\bnot acceptable\b/,
  /\bdisagree\b/,
];

const RISK_PATTERNS = [
  /\brisk\b/,
  /\bissue\b/,
  /\bproblem\b/,
  /\bconcern\b/,
  /\bif .*\bthen\b/,
  /\bif\b.*\bnot\b/,
  /\bmay\b/,
  /\bmight\b/,
  /\bcould\b/,
  /\bunless\b/,
];

const MISSING_INFO_PATTERNS = [
  /\bneed more\b/,
  /\bmissing\b/,
  /\bdon't have\b/,
  /\bunknown\b/,
  /\bneed details\b/,
  /\bnot enough\b/,
  /\bplease clarify\b/,
  /\bverify whether\b/,
  /\bneed confirmation\b/,
];

function estimateConfusionConfidence(category, text) {
  let score = 0.3;
  const lower = text.toLowerCase();

  if (category === "unclear") {
    if (/\bnot sure\b|\bunclear\b|\bconfusing\b|\bconfusion\b/.test(lower)) score += 0.45;
    if (/\bneed clarification\b|\bplease clarify\b|\bnot clear\b/.test(lower)) score += 0.35;
  }

  if (category === "disagreements") {
    if (/\bi disagree\b|\bdisagree\b/.test(lower)) score += 0.45;
    if (/\bthat's wrong\b|\bnot acceptable\b/.test(lower)) score += 0.35;
    if (/\bhowever\b|\bbut\b/.test(lower)) score += 0.2;
  }

  if (category === "risks") {
    if (/\brisk\b|\bissue\b|\bproblem\b|\bconcern\b/.test(lower)) score += 0.45;
    if (/\bmay\b|\bmight\b|\bcould\b|\bunless\b/.test(lower)) score += 0.2;
  }

  if (category === "missingInformation") {
    if (/\bneed more\b|\bmissing\b|\bdon't have\b|\bunknown\b/.test(lower)) score += 0.45;
    if (/\bneed details\b|\bnot enough\b|\bplease clarify\b/.test(lower)) score += 0.35;
  }

  return Number(Math.min(0.98, score).toFixed(2));
}

function localDetectConfusionRisks(meetingContext) {
  const lines = String(meetingContext || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const result = {
    unclear: [],
    disagreements: [],
    risks: [],
    missingInformation: [],
  };

  for (const line of lines) {
    const timestamp = parseTimestampFromLine(line);
    const cleanedLine = timestamp ? line.replace(/^\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/, "").trim() : line;
    const { speaker, text } = parseSpeakerFromLine(cleanedLine);
    const statement = parseDecisionStatement(text);
    if (!statement) continue;

    const lower = statement.toLowerCase();

    if (CONFUSION_PATTERNS.some((pattern) => pattern.test(lower))) {
      result.unclear.push({
        statement,
        speaker: speaker || "Unknown",
        confidence: estimateConfusionConfidence("unclear", statement),
        timestamp,
      });
    }

    if (DISAGREEMENT_PATTERNS.some((pattern) => pattern.test(lower))) {
      result.disagreements.push({
        statement,
        speaker: speaker || "Unknown",
        confidence: estimateConfusionConfidence("disagreements", statement),
        timestamp,
      });
    }

    if (RISK_PATTERNS.some((pattern) => pattern.test(lower))) {
      result.risks.push({
        statement,
        speaker: speaker || "Unknown",
        confidence: estimateConfusionConfidence("risks", statement),
        timestamp,
      });
    }

    if (MISSING_INFO_PATTERNS.some((pattern) => pattern.test(lower))) {
      result.missingInformation.push({
        statement,
        speaker: speaker || "Unknown",
        confidence: estimateConfusionConfidence("missingInformation", statement),
        timestamp,
      });
    }
  }

  if (
    result.unclear.length === 0 &&
    result.disagreements.length === 0 &&
    result.risks.length === 0 &&
    result.missingInformation.length === 0
  ) {
    const sentences = String(meetingContext || "")
      .split(/(?<=[.?!])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      const timestamp = parseTimestampFromLine(sentence);
      const cleanedSentence = timestamp
        ? sentence.replace(/^\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/, "").trim()
        : sentence;
      const { speaker, text } = parseSpeakerFromLine(cleanedSentence);
      const statement = parseDecisionStatement(text);
      if (!statement) continue;

      if (CONFUSION_PATTERNS.some((pattern) => pattern.test(lower))) {
        result.unclear.push({
          statement,
          speaker: speaker || "Unknown",
          confidence: estimateConfusionConfidence("unclear", statement),
          timestamp,
        });
      }

      if (DISAGREEMENT_PATTERNS.some((pattern) => pattern.test(lower))) {
        result.disagreements.push({
          statement,
          speaker: speaker || "Unknown",
          confidence: estimateConfusionConfidence("disagreements", statement),
          timestamp,
        });
      }

      if (RISK_PATTERNS.some((pattern) => pattern.test(lower))) {
        result.risks.push({
          statement,
          speaker: speaker || "Unknown",
          confidence: estimateConfusionConfidence("risks", statement),
          timestamp,
        });
      }

      if (MISSING_INFO_PATTERNS.some((pattern) => pattern.test(lower))) {
        result.missingInformation.push({
          statement,
          speaker: speaker || "Unknown",
          confidence: estimateConfusionConfidence("missingInformation", statement),
          timestamp,
        });
      }
    }
  }

  return {
    unclear: result.unclear.slice(0, 12),
    disagreements: result.disagreements.slice(0, 12),
    risks: result.risks.slice(0, 12),
    missingInformation: result.missingInformation.slice(0, 12),
  };
}

function parseJsonResponse(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;

  const tryParse = (snippet) => {
    try {
      return JSON.parse(snippet);
    } catch {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    const parsed = tryParse(trimmed.slice(objectStart, objectEnd + 1));
    if (parsed) return parsed;
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    const parsed = tryParse(trimmed.slice(arrayStart, arrayEnd + 1));
    if (Array.isArray(parsed)) return { decisions: parsed };
  }

  return null;
}

function normalizeConfusionResults(parsedResult) {
  const normalizeItems = (items) => {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map((item) => {
      if (typeof item === "string") {
        return { statement: item };
      }
      if (item && typeof item === "object") {
        return item;
      }
      return { statement: String(item) };
    });
  };

  return {
    unclear: normalizeItems(parsedResult?.unclear),
    disagreements: normalizeItems(parsedResult?.disagreements),
    risks: normalizeItems(parsedResult?.risks),
    missingInformation: normalizeItems(parsedResult?.missingInformation),
  };
}

export const extractActionItems = async (req, res) => {
  try {
    const { meetingContext } = req.body;
    if (!meetingContext || !meetingContext.trim()) {
      return res.status(400).json({ message: "Meeting context is required" });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const prompt = `Extract action items from the meeting transcript below. Return valid JSON with an array named actionItems. Each item should include: taskTitle, assignedTo, deadline, priority. If there are no clear action items, return {"actionItems": []}.

Meeting transcript:\n${meetingContext}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a meeting intelligence assistant. Extract action items precisely and return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = response.choices[0].message.content || "";
    const parsed = parseJsonResponse(raw);
    const actionItems = Array.isArray(parsed?.actionItems)
      ? parsed.actionItems
      : localExtractActionItems(meetingContext);

    return res.status(200).json({
      actionItems,
      source: Array.isArray(parsed?.actionItems) ? "groq" : "local",
      raw,
    });
  } catch (error) {
    if (isInsufficientQuotaError(error)) {
      const actionItems = localExtractActionItems(req.body?.meetingContext);
      return res.status(200).json({
        actionItems,
        source: "local",
        warning: "insufficient_quota",
      });
    }

    console.error("AI ACTION EXTRACTION ERROR:", error?.response?.data || error);
    const actionItems = localExtractActionItems(req.body?.meetingContext);
    return res.status(200).json({
      actionItems,
      source: "local",
      warning: "ai_error",
    });
  }
};

export const detectConfusion = async (req, res) => {
  try {
    const { meetingContext } = req.body;
    if (!meetingContext || !meetingContext.trim()) {
      return res.status(400).json({ message: "Meeting context is required" });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const prompt = `Analyze the meeting transcript below and identify any unclear statements, disagreements, risks, and missing information. Return only valid JSON in this format:\n{\n  "unclear": [],\n  "disagreements": [],\n  "risks": [],\n  "missingInformation": []\n}\nIf a category has no items, return an empty array for that category.\n\nMeeting transcript:\n${meetingContext}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a meeting intelligence assistant. Extract unclear statements, disagreements, risks, and missing information precisely and return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = response.choices[0].message.content || "";
    const parsed = parseJsonResponse(raw);
    const result = parsed ? normalizeConfusionResults(parsed) : localDetectConfusionRisks(meetingContext);

    return res.status(200).json({
      unclear: Array.isArray(result.unclear) ? result.unclear : [],
      disagreements: Array.isArray(result.disagreements) ? result.disagreements : [],
      risks: Array.isArray(result.risks) ? result.risks : [],
      missingInformation: Array.isArray(result.missingInformation) ? result.missingInformation : [],
      source: parsed ? "groq" : "local",
      raw,
    });
  } catch (error) {
    if (isInsufficientQuotaError(error)) {
      const result = localDetectConfusionRisks(req.body?.meetingContext);
      return res.status(200).json({
        unclear: result.unclear,
        disagreements: result.disagreements,
        risks: result.risks,
        missingInformation: result.missingInformation,
        source: "local",
        warning: "insufficient_quota",
      });
    }

    console.error("AI CONFUSION DETECTION ERROR:", error?.response?.data || error);
    const result = localDetectConfusionRisks(req.body?.meetingContext);
    return res.status(200).json({
      unclear: result.unclear,
      disagreements: result.disagreements,
      risks: result.risks,
      missingInformation: result.missingInformation,
      source: "local",
      warning: "ai_error",
    });
  }
};

export const detectDecisions = async (req, res) => {
  try {
    const { meetingContext } = req.body;
    if (!meetingContext || !meetingContext.trim()) {
      return res.status(400).json({ message: "Meeting context is required" });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const prompt = `Extract only the decisions made or agreed upon from the meeting transcript below. Return valid JSON with an array named decisions. Each decision object should include: statement, agreedBy, confidence, timestamp. If the transcript does not contain any clear decisions, return {"decisions": []}.

Meeting transcript:\n${meetingContext}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a meeting intelligence assistant. Extract decisions precisely and return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = response.choices[0].message.content || "";
    const parsed = parseJsonResponse(raw);
    const decisions = Array.isArray(parsed?.decisions) ? parsed.decisions : localDetectDecisions(meetingContext);

    return res.status(200).json({
      decisions,
      source: Array.isArray(parsed?.decisions) ? "groq" : "local",
      raw,
    });
  } catch (error) {
    if (isInsufficientQuotaError(error)) {
      const decisions = localDetectDecisions(req.body?.meetingContext);
      return res.status(200).json({
        decisions,
        source: "local",
        warning: "insufficient_quota",
      });
    }

    console.error("AI DECISION DETECTION ERROR:", error?.response?.data || error);
    const decisions = localDetectDecisions(req.body?.meetingContext);
    return res.status(200).json({
      decisions,
      source: "local",
      warning: "ai_error",
    });
  }
};

/* =====================================================
   1️⃣ ASK AI DURING MEETING
   Endpoint: POST /api/v1/ai/ask
===================================================== */
export const askMeetingAI = async (req, res) => {
  try {
    const { question, meetingContext } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        answer: "❌ Question is required",
      });
    }

    const context =
      meetingContext && meetingContext.trim().length > 0
        ? meetingContext
        : "No prior meeting context yet.";

    // ✅ IMPORTANT FIX: Groq client YAHAN banta hai
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly AI meeting buddy. Reply with a warm, helpful tone, keep answers concise, and focus on meeting insights, action items, and next steps.",
        },
        {
          role: "user",
          content: `Meeting Context:\n${context}\n\nUser Question:\n${question}`,
        },
      ],
    });

    const answer = response.choices[0].message.content;

    return res.status(200).json({
      answer,
    });
  } catch (error) {
    if (isInsufficientQuotaError(error)) {
      return res.status(200).json({
        answer:
          "AI is temporarily unavailable (Groq quota exceeded). Please try again later.",
        source: "local",
        warning: "insufficient_quota",
      });
    }

    console.error("AI ASK ERROR:", error);
    return res.status(500).json({
      answer: "❌ AI failed to respond",
    });
  }
};


/* =====================================================
   2️⃣ AUTO MEETING SUMMARY
   Endpoint: POST /api/v1/ai/summarize
===================================================== */
export const summarizeMeeting = async (req, res) => {
  try {
    const { meetingContext } = req.body;

    if (!meetingContext || !meetingContext.trim()) {
      return res.status(400).json({
        summary: "❌ Meeting context is required for summary",
      });
    }

   const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const response = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [
    {
      role: "system",
      content:
        "You summarize meetings into clear bullet points and action items.",
    },
    {
      role: "user",
      content: `Summarize this meeting and list action items:\n\n${meetingContext}`,
    },
  ],
});


    res.status(200).json({
      summary: response.choices[0].message.content,
      source: "groq",
    });
  } catch (error) {
    if (isInsufficientQuotaError(error)) {
      const local = localSummarize(req.body?.meetingContext);
      return res.status(200).json({
        summary: local.summary,
        source: "local",
        warning: "insufficient_quota",
      });
    }

    console.error("AI SUMMARY ERROR:", error?.response?.data || error);
    return res.status(500).json({
      summary: "❌ Summary failed",
    });
  }
};

/* =====================================================
   3️⃣ AUTO SUMMARY + TASKS
   Endpoint: POST /api/v1/ai/summarize-tasks
===================================================== */
export const summarizeMeetingWithTasks = async (req, res) => {
  try {
    const { meetingContext } = req.body;

    if (!meetingContext || !meetingContext.trim()) {
      return res.status(400).json({
        message: "Meeting context is required",
      });
    }

    const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});



const response = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [
    {
      role: "system",
      content:
        "You summarize meetings into bullet points and extract clear action items and key decisions made.",
    },
    {
      role: "user",
      content: `
Summarize this meeting in bullet points.
List action items clearly.
Also list key DECISIONS made.

Meeting:
${meetingContext}

Format:
SUMMARY:
- point 1
- point 2

TASKS:
- task 1
- task 2

DECISIONS:
- decision 1
- decision 2
`,
    },
  ],
});


    const text = response.choices[0].message.content || "";

    // 🔹 Simple parsing (summary, tasks, decisions)
    const summaryPart = text.split("TASKS:")[0]?.replace("SUMMARY:", "").trim();
    const afterTasks = text.split("TASKS:")[1] || "";
    const tasksPart = afterTasks.split("DECISIONS:")[0]?.trim();
    const decisionsPart = afterTasks.split("DECISIONS:")[1]?.trim();

    const tasks = tasksPart
      ? tasksPart
          .split("\n")
          .map((t) => t.replace("-", "").trim())
          .filter(Boolean)
      : [];

    const decisions = decisionsPart
      ? decisionsPart
          .split("\n")
          .map((d) => d.replace("-", "").trim())
          .filter(Boolean)
      : [];

    return res.status(200).json({
      summary: summaryPart || "Summary not generated",
      tasks,
      decisions,
      raw: text,
      source: "groq",
    });
  } catch (error) {
    if (isInsufficientQuotaError(error)) {
      const local = localSummarize(req.body?.meetingContext);
      return res.status(200).json({
        summary: local.summary.split("\n\nTASKS:\n")[0]?.replace(/^SUMMARY:\n?/, "").trim() || local.summary,
        tasks: local.tasks,
        decisions: local.decisions || [],
        raw: local.summary,
        source: "local",
        warning: "insufficient_quota",
      });
    }

    console.error("AI SUMMARY TASK ERROR:", error?.response?.data || error);
    return res.status(500).json({
      message: "Summary failed",
    });
  }
};

/* =====================================================
   4️⃣ EMOTION / SENTIMENT (Voice / transcript)
   Endpoint: POST /api/v1/ai/sentiment
===================================================== */
function localSentiment(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.length < 3) return { emotion: "neutral", source: "local" };
  const positive = ["happy", "great", "thanks", "good", "awesome", "love", "excited", "yes", "agree", "perfect"];
  const negative = ["sad", "angry", "bad", "hate", "no", "wrong", "disagree", "frustrated", "upset"];
  let score = 0;
  for (const w of positive) {
    if (lower.includes(w)) score += 1;
  }
  for (const w of negative) {
    if (lower.includes(w)) score -= 1;
  }
  let emotion = "neutral";
  if (score > 0) emotion = "positive";
  else if (score < 0) emotion = "negative";
  return { emotion, source: "local" };
}

export const getSentiment = async (req, res) => {
  try {
    const { text } = req.body;
    const input = (text && String(text).trim()) || "";

    if (!input) {
      return res.status(200).json({
        emotion: "neutral",
        label: "No text to analyze",
        source: "local",
      });
    }



   try {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You detect emotion/sentiment from the given text. Reply with exactly one word: happy, sad, angry, neutral, excited, calm, frustrated, or surprised. No other text.",
          },
          {
            role: "user",
            content: input.slice(0, 1000),
          },
        ],
      });

      const emotion = (response.choices[0].message.content || "neutral").trim().toLowerCase();
      const allowed = ["happy", "sad", "angry", "neutral", "excited", "calm", "frustrated", "surprised"];
      const final = allowed.includes(emotion) ? emotion : "neutral";

      return res.status(200).json({
        emotion: final,
        label: final,
         source: "groq",
      });
   } catch (aiErr) {
  if (isInsufficientQuotaError(aiErr)) {
        const local = localSentiment(input);
        const label = local.emotion === "positive" ? "happy" : local.emotion === "negative" ? "sad" : "neutral";
        return res.status(200).json({
          emotion: label,
          label,
          source: "local",
          warning: "insufficient_quota",
        });
      }
      throw aiErr;
    }
  } catch (e) {
    console.error("Sentiment error:", e);
    return res.status(500).json({ emotion: "neutral", label: "Error" });
  }
};
