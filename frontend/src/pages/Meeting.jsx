import { useState } from "react";
import axios from "axios";
import server from "../environment";

const Meeting = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "You", data: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const meetingContext = [...messages, userMsg]
        .map((m) => `${m.sender}: ${m.data}`)
        .join("\n");

      const res = await axios.post(
        `${server}/api/v1/ai/ask`,
        {
          question: input,
          meetingContext,
        }
      );

      setMessages((prev) => [
        ...prev,
        { sender: "AI 🤖", data: res.data.answer },
      ]);
    } catch (err) {
      console.error("AI ERROR:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "AI 🤖", data: "❌ AI failed to respond" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🧠 AI Powered Meeting</h2>

      <div style={styles.chatBox}>
        {messages.map((msg, i) => (
          <div key={i} style={styles.message}>
            <strong>{msg.sender}</strong>
            <div>{msg.data}</div>
          </div>
        ))}

        {loading && (
          <div style={{ color: "#aaa" }}>AI is thinking...</div>
        )}
      </div>

      <div style={styles.inputBox}>
        <input
          style={styles.input}
          placeholder="Type message or /ai question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button style={styles.button} onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    padding: "20px",
  },
  title: {
    textAlign: "center",
    marginBottom: "10px",
  },
  chatBox: {
    height: "75vh",
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "15px",
    overflowY: "auto",
  },
  message: {
    marginBottom: "12px",
  },
  inputBox: {
    display: "flex",
    marginTop: "10px",
  },
  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    outline: "none",
  },
  button: {
    marginLeft: "10px",
    padding: "12px 20px",
    background: "#2563eb",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
  },
};

export default Meeting;
