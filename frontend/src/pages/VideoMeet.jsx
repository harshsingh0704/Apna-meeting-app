import { useNavigate } from "react-router-dom";
import RestoreIcon from "@mui/icons-material/Restore";
import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';
import axios from "axios";




const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    const navigate = useNavigate();

    
    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

  // ================= AI CHAT STATES =================
const [aiMessages, setAiMessages] = useState([]);
const [aiInput, setAiInput] = useState("");
const [aiLoading, setAiLoading] = useState(false);
const [aiOpen, setAiOpen] = useState(false);
// =================================================

const [aiPos, setAiPos] = useState({ x: 60, y: 120 });
const [dragging, setDragging] = useState(false);
const dragOffset = useRef({ x: 0, y: 0 });


    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // TODO
    // if(isChrome() === false) {


    // }

   useEffect(() => {
    console.log("HELLO");
    getPermissions();
}, []);

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);

        }
    }, [video, audio])


    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();

    }




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }





    let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        setVideo(!video);
        // getUserMedia();
    }
    let handleAudio = () => {
        setAudio(!audio)
        // getUserMedia();
    }


    // let handleVideo = () => {
    // const track = window.localStream?.getVideoTracks()[0];
    // if (!track) return;

    // track.enabled = !track.enabled;
    // setVideo(track.enabled);
    // };

    // let handleAudio = () => {
    // const track = window.localStream?.getAudioTracks()[0];
    // if (!track) return;

    // track.enabled = !track.enabled;
    // setAudio(track.enabled);
    // };



    

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }



let handleEndCall = async () => {
  console.log("📌 END CALL CLICKED");

  try {
    await saveSummaryToDB();
    console.log("✅ Summary saved");
  } catch (err) {
    console.log("❌ Summary save failed:", err);
  }

  try {
    const tracks = localVideoref.current?.srcObject?.getTracks();
    tracks?.forEach((track) => track.stop());
  } catch (e) {
    console.log("Track stop error:", e);
  }

  navigate("/home"); // ✅ no reload
};




    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    
    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }



    
 const askAI = async () => {
  if (!aiInput.trim()) return;

  const userQuestion = aiInput;

  // 1️⃣ Show user message immediately
  setAiMessages((prev) => [
    ...prev,
    { sender: "You", data: userQuestion },
  ]);

  setAiInput("");
  setAiLoading(true);

  try {
    // 2️⃣ Build meeting context safely
    const meetingContext =
      messages && messages.length > 0
        ? messages.map((m) => `${m.sender}: ${m.data}`).join("\n")
        : "No meeting messages yet.";

    // 3️⃣ Call backend AI
    const res = await fetch(`${server_url}/api/v1/ai/ask`, {

      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: userQuestion,
        meetingContext,
      }),
    });

    if (!res.ok) {
      throw new Error("AI API failed");
    }

    const data = await res.json();

    // 4️⃣ Show AI response
    setAiMessages((prev) => [
      ...prev,
      {
        sender: "AI 🤖",
        data: data?.answer || "⚠️ AI gave empty response",
      },
    ]);
  } catch (error) {
    console.error("AI ERROR:", error);

    setAiMessages((prev) => [
      ...prev,
      { sender: "AI 🤖", data: "❌ AI failed to respond" },
    ]);
  } finally {
    setAiLoading(false);
  }
};



const onAiMouseDown = (e) => {
  setDragging(true);
  dragOffset.current = {
    x: e.clientX - aiPos.x,
    y: e.clientY - aiPos.y,
  };
};

useEffect(() => {
  const onMouseMove = (e) => {
    if (!dragging) return;

    setAiPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  };

  const onMouseUp = () => setDragging(false);

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };
}, [dragging]);




const saveSummaryToDB = async () => {
  console.log("🔥 saveSummaryToDB CALLED");
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("❌ Token missing");
      return;
    }

    const meetingCode = window.location.pathname.replace("/", "");

    const meetingContext =
      messages.length > 0
        ? messages.map((m) => `${m.sender}: ${m.data}`).join("\n")
        : "No meeting messages yet.";

    const res = await fetch(`${server_url}/api/v1/ai/summarize-tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, meetingContext }),
    });

    const aiData = await res.json();

    if (!res.ok) {
      console.log("❌ AI summarize failed:", aiData);
      return;
    }

    // ✅ tasks clean fix
    let tasks = aiData?.tasks || [];

    if (Array.isArray(tasks) && tasks.length === 1 && tasks[0] === "[]") {
      tasks = [];
    }
    if (typeof tasks === "string" && tasks === "[]") {
      tasks = [];
    }

    if (Array.isArray(tasks) && tasks.length === 1 && tasks[0].toLowerCase() === "none") {
  tasks = [];
}


    const saveRes = await fetch(`${server_url}/api/v1/meeting/save-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        meetingCode,
        meetingContext,
        summary: aiData?.summary || "",
        actionItems: tasks,
      }),
    });

    const saveData = await saveRes.json();

    if (!saveRes.ok) {
      console.log("❌ Save summary failed:", saveData);
      return;
    }

    console.log("✅ Summary saved in DB:", saveData);
  } catch (err) {
    console.log("❌ Summary save failed", err);
  }
};






const generateSummary = async () => {
  console.log("🔥 generateSummary CALLED");  // 👈 ye line add karo

  try {
    const meetingContext =
      messages && messages.length > 0
        ? messages.map((m) => `${m.sender}: ${m.data}`).join("\n")
        : "No meeting messages yet.";

    const res = await axios.post("http://localhost:8000/api/v1/ai/summarize", {
      meetingCode: window.location.pathname.replace("/", ""),
      meetingContext,
    });

    alert("✅ Summary Saved Successfully!");
    console.log(res.data);
  } catch (err) {
    console.log(err);
    alert("❌ Summary was not generated.");
  }
};








    return (
        <div>

            {askForUsername === true ?

                <div>


                    <h2>Enter into Lobby </h2>
                    <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
                    <Button variant="contained" onClick={connect}>Connect</Button>


                    <div>
                        <video ref={localVideoref} autoPlay muted></video>
                    </div>

                </div> :


                <div className={styles.meetVideoContainer}>

{/* ================= ZOOM CHAT ONLY ================= */}
{showModal ? (
  <div className={styles.chatRoom}>
    <div className={styles.chatContainer}>
      <h2>💬 Meeting Chat</h2>

      <div className={styles.chattingDisplay}>
        {messages.length !== 0 ? messages.map((item, index) => (
          <div style={{ marginBottom: "12px" }} key={index}>
            <b>{item.sender}</b>
            <p>{item.data}</p>
          </div>
        )) : <p>No Messages Yet</p>}
      </div>

      <div className={styles.chattingArea}>
        <TextField
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          label="Send message"
          fullWidth
        />
        <Button variant="contained" onClick={sendMessage}>
          Send
        </Button>
      </div>
    </div>
  </div>
) : null}


{/* ================= AI FLOAT ICON ================= */}
<div
  className={styles.aiFab}
  onClick={() => setAiOpen(true)}
  title="Open AI Assistant"
>
  🤖
</div>


{/* ================= AI POPUP CHAT ================= */}
{aiOpen && (
 <div
  className={styles.aiChatBox}
  style={{
    left: aiPos.x,
    top: aiPos.y,
    right: "auto",
    bottom: "auto",
  }}
>

   <div className={styles.aiHeader} onMouseDown={onAiMouseDown}>

      🤖 AI Meeting Assistant

      <button
        className={styles.aiCloseBtn}
        onClick={() => setAiOpen(false)}
      >
        ✖
      </button>
    </div>

    <div className={styles.aiMessages} id="ai-scroll">
      {aiMessages.length === 0 && (
        <p className={styles.emptyText}>
          Ask anything about the meeting...
        </p>
      )}

      {aiMessages.map((msg, index) => (
        <div
          key={index}
          className={msg.sender === "You" ? styles.userMsg : styles.aiMsg}
        >
          <b>{msg.sender}:</b>
          <p>{msg.data}</p>
        </div>
      ))}

      {aiLoading && (
        <p className={styles.thinking}>🤖 AI is thinking...</p>
      )}
    </div>

    <div className={styles.aiInputBox}>
      <input
        type="text"
        placeholder="Ask AI something..."
        value={aiInput}
        onChange={(e) => setAiInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && askAI()}
      />
      <button onClick={askAI}>ASK</button>
    </div>
  </div>
)}




<div className={styles.buttonContainers}>

  <IconButton onClick={handleVideo}>
    {video ? <VideocamIcon /> : <VideocamOffIcon />}
  </IconButton>

  <IconButton onClick={handleEndCall} className={styles.endCall}>
    <CallEndIcon />
  </IconButton>

  <IconButton onClick={handleAudio}>
    {audio ? <MicIcon /> : <MicOffIcon />}
  </IconButton>

  {screenAvailable && (
    <IconButton onClick={handleScreen}>
      {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
    </IconButton>
  )}

  {/* ✅ SUMMARY BUTTON */}
  <IconButton onClick={generateSummary}>
    <RestoreIcon />
  </IconButton>

  {/* ✅ HISTORY BUTTON */}
  <IconButton onClick={() => navigate("/history")}>
    <RestoreIcon />
  </IconButton>

  <Badge badgeContent={newMessages} max={999} color="error">
    <IconButton onClick={() => setModal(!showModal)}>
      <ChatIcon />
    </IconButton>
  </Badge>

</div>





                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div key={video.socketId}>
                                <video

                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                >
                                </video>
                            </div>

                        ))}

                    </div>

                </div>

            }

        </div>
    )
}
