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
            "You are an AI assistant for online meetings. Answer clearly, briefly, and professionally.",
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
