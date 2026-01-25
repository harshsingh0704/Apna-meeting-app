import openai from "../config/openai.js";

/* =====================================================
   1️⃣ ASK AI DURING MEETING
   Endpoint: POST /api/v1/ai/ask
===================================================== */
export const askMeetingAI = async (req, res) => {
  try {
    const { question, meetingContext } = req.body;

    // ✅ Only question is required
    if (!question || !question.trim()) {
      return res.status(400).json({
        answer: "❌ Question is required",
      });
    }

    // ✅ meetingContext optional
    const context =
      meetingContext && meetingContext.trim().length > 0
        ? meetingContext
        : "No prior meeting context yet.";

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
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

    res.status(200).json({
      answer: response.output_text || "AI did not return a response",
    });
  } catch (error) {
    console.error("AI ASK ERROR:", error);
    res.status(500).json({
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

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
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
      summary: response.output_text || "Summary not generated",
    });
  } catch (error) {
    console.error("AI SUMMARY ERROR:", error);
    res.status(500).json({
      summary: "❌ Summary failed",
    });
  }
};




export const summarizeMeetingWithTasks = async (req, res) => {
  try {
    const { meetingContext } = req.body;

    if (!meetingContext || !meetingContext.trim()) {
      return res.status(400).json({
        message: "Meeting context is required",
      });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You summarize meetings into bullet points and return action items as a list.",
        },
        {
          role: "user",
          content: `
Summarize this meeting in bullet points.
Also give action items in a JSON array.

Meeting:
${meetingContext}

Return format strictly like this:
SUMMARY:
- point 1
- point 2

TASKS:
- task 1
- task 2
`,
        },
      ],
    });

    const text = response.output_text || "";

    // simple parsing
    const summaryPart = text.split("TASKS:")[0]?.replace("SUMMARY:", "").trim();
    const tasksPart = text.split("TASKS:")[1]?.trim();

    const tasks = tasksPart
      ? tasksPart
          .split("\n")
          .map((t) => t.replace("-", "").trim())
          .filter(Boolean)
      : [];

    return res.status(200).json({
      summary: summaryPart || "Summary not generated",
      tasks,
      raw: text,
    });
  } catch (error) {
    console.error("AI SUMMARY TASK ERROR:", error?.message || error);
    res.status(500).json({
      message: "Summary failed",
    });
  }
};
