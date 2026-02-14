# Automatic Minutes & Action Item Extraction

**STATUS: ✅ IMPLEMENTED**

| Feature | Status |
|--------|--------|
| ✔ Meeting History screen | Done |
| ✔ Summary section | Done |
| ✔ Tasks section | Done |
| ✔ PDF download structure | Done |
| ✔ **Real-time Speech-to-Text** | **Done** (browser Web Speech API) |
| ✔ **Auto decision extraction** | **Done** (AI pipeline + data model) |
| ✔ UI + data model + AI pipeline | Complete |

**Viva answer (short):**  
*"Automatic Minutes & Action Item Extraction is fully implemented. We have Meeting History, Summary, Tasks, and PDF download. Real-time Speech-to-Text runs in the meeting using the browser's Web Speech API and feeds into the transcript. Auto decision extraction is done via the AI pipeline: we extract summary, action items, and decisions from meeting context and save them; the UI and PDF show summary, action items, and decisions."*

---

# Advanced Analytics Dashboard

**STATUS: ✅ IMPLEMENTED**

| Feature | Status |
|--------|--------|
| ✔ **Speaker-wise metrics** | Done (message count + word count per speaker) |
| ✔ **Engagement graphs** | Done (messages by phase: Start / Early mid / Late mid / End) |
| ✔ **Keyword trends** | Done (top 20 words from meeting context) |

**Where:** History page → open a meeting → **View Analytics** button.

**Viva answer (short):**  
*"Advanced Analytics Dashboard is implemented. On the History page, for each meeting we have a View Analytics button. It shows speaker-wise metrics (who sent how many messages and words), engagement graph (message distribution across meeting phases), and keyword trends (most frequent words from the transcript)."*

---

# Emotion & Sentiment Analysis

**STATUS: ✅ IMPLEMENTED**

| Feature | Status |
|--------|--------|
| ✔ **Voice emotion detection** | Done (sentiment from transcript via AI + fallback) |
| ✔ **Face emotion detection** | Done (face-api.js + expression net; needs model files in public/models) |

**Where:** Video meeting → Live transcript panel: **Check voice sentiment**; Control bar: 😊 **Face emotion** toggle.

**Viva answer (short):**  
*"Emotion and sentiment analysis is implemented. Voice emotion is detected from the live transcript (or chat) using an AI sentiment API. Face emotion uses face-api.js in the browser to detect expressions from the camera; model files go in public/models."*
