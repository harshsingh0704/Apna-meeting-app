import { useNavigate } from "react-router-dom";
import RestoreIcon from "@mui/icons-material/Restore";
import React, { useEffect, useRef, useState, useContext } from 'react'
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
import AssignmentIcon from '@mui/icons-material/Assignment';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import server from '../environment';
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";




const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    const navigate = useNavigate();
    const { addToUserHistory } = useContext(AuthContext);

    
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

    const [tasks, setTasks] = useState([]);
    const [showTaskDashboard, setShowTaskDashboard] = useState(false);
    const [participants, setParticipants] = useState([]);

    const [canRecord, setCanRecord] = useState(false);

  // ================= AI CHAT STATES =================
const [aiMessages, setAiMessages] = useState([]);
const [aiInput, setAiInput] = useState("");
const [aiLoading, setAiLoading] = useState(false);
const [aiOpen, setAiOpen] = useState(false);
// =================================================

const [aiPos, setAiPos] = useState({ x: 60, y: 120 });
const [dragging, setDragging] = useState(false);
const dragOffset = useRef({ x: 0, y: 0 });

// ================= RECORDING STATES =================
const [isRecording, setIsRecording] = useState(false);
const [recordingTime, setRecordingTime] = useState(0);
const mediaRecorderRef = useRef(null);
const recordedChunksRef = useRef([]);
const recordingStartTimeRef = useRef(null);
const recordingIntervalRef = useRef(null);
// =================================================

// ================= REAL-TIME SPEECH-TO-TEXT =================
const [liveTranscript, setLiveTranscript] = useState([]);
const [sttEnabled, setSttEnabled] = useState(false);
const [interimTranscript, setInterimTranscript] = useState("");
const recognitionRef = useRef(null);
// =================================================

// ================= EMOTION & SENTIMENT =================
const [voiceSentiment, setVoiceSentiment] = useState(null);
const [sentimentLoading, setSentimentLoading] = useState(false);
const [faceEmotion, setFaceEmotion] = useState(null);
const [faceEmotionEnabled, setFaceEmotionEnabled] = useState(false);
const faceDetectionIntervalRef = useRef(null);
// =================================================

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // TODO
    // if(isChrome() === false) {


    // }

   // Helper to get meeting code from URL: /meet/:code
   const getMeetingCodeFromPath = () => {
     const parts = window.location.pathname.split("/");
     return parts[parts.length - 1] || "";
   };

   useEffect(() => {
    getPermissions();
    
    // ✅ Ensure meeting is added to history when component mounts
    const ensureMeetingInHistory = async () => {
      try {
        const meetingCode = getMeetingCodeFromPath();
        if (meetingCode && meetingCode.trim() !== "") {
          await addToUserHistory(meetingCode);
          console.log("✅ Meeting added to history:", meetingCode);
        }
      } catch (err) {
        console.log("⚠️ Meeting might already be in history:", err);
      }
    };
    
    ensureMeetingInHistory();
    
    // ✅ Recording is now FREE for all users
    setCanRecord(true);
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

// ================= RECORDING FUNCTIONS =================
const startRecording = async () => {
  // ✅ Recording is now FREE for all users
  try {
    // Get screen + audio stream
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
      video: true, 
      audio: true 
    });
    
    // Get microphone audio
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Combine streams
    const combinedStream = new MediaStream();
    
    // Add video track from screen
    screenStream.getVideoTracks().forEach(track => {
      combinedStream.addTrack(track);
    });
    
    // Add audio tracks from both screen and microphone
    [...screenStream.getAudioTracks(), ...audioStream.getAudioTracks()].forEach(track => {
      combinedStream.addTrack(track);
    });

    // Create MediaRecorder
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });

    recordedChunksRef.current = [];
    recordingStartTimeRef.current = Date.now();

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      await saveRecordingToServer(blob);
      
      // Stop all tracks
      combinedStream.getTracks().forEach(track => track.stop());
      screenStream.getTracks().forEach(track => track.stop());
      audioStream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordingTime(0);

    // Update recording time every second
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
    }, 1000);

    // Handle screen share stop
    screenStream.getVideoTracks()[0].onended = () => {
      stopRecording();
    };

  } catch (err) {
    console.error("Recording error:", err);
    alert("❌ Failed to start recording. Please check permissions.");
  }
};

const stopRecording = () => {
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  }
};

const saveRecordingToServer = async (blob) => {
  try {
    const token = localStorage.getItem("token");
    const meetingCode = getMeetingCodeFromPath();
    const duration = recordingTime;

    // Convert blob to base64 for simple storage (for MVP)
    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    
    reader.onloadend = async () => {
      const base64Recording = reader.result;
      
      // For now, we'll store as data URL. In production, upload to cloud storage
      const recordingUrl = base64Recording; // Or upload to S3/Cloudinary and get URL
      
      const res = await fetch(`${server_url}/api/v1/meeting/save-recording`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          meetingCode,
          recordingUrl,
          recordingDuration: duration,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(`✅ Recording saved! Duration: ${formatTime(duration)}`);
        console.log("Recording saved:", data);
      } else {
        alert("❌ Failed to save recording: " + (data.message || "Unknown error"));
      }
    };
  } catch (err) {
    console.error("Save recording error:", err);
    alert("❌ Failed to save recording");
  }
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
// =================================================

// ================= REAL-TIME SPEECH-TO-TEXT (Web Speech API) =================
useEffect(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition || askForUsername) return;

  if (sttEnabled) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      const newFinals = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinals.push(transcript.trim());
        } else {
          interim += transcript;
        }
      }
      if (newFinals.length) {
        setLiveTranscript((prev) => [...prev, ...newFinals].filter(Boolean));
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech") console.warn("Speech recognition error:", e.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch (err) {}
      recognitionRef.current = null;
    };
  } else {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
      recognitionRef.current = null;
    }
    setInterimTranscript("");
  }
}, [sttEnabled, askForUsername]);
// =================================================

// ================= VOICE SENTIMENT (from transcript) =================
const checkVoiceSentiment = async () => {
  const text =
    liveTranscript.length > 0
      ? liveTranscript.slice(-15).join(" ")
      : messages.length > 0
        ? messages.slice(-10).map((m) => `${m.sender}: ${m.data}`).join(" ")
        : "";
  if (!text.trim()) {
    return;
  }
  setSentimentLoading(true);
  setVoiceSentiment(null);
  try {
    const res = await fetch(`${server_url}/api/v1/ai/sentiment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 1000) }),
    });
    const data = await res.json();
    if (res.ok) {
      setVoiceSentiment(data);
    }
  } catch (err) {
    console.warn("Sentiment error:", err);
  } finally {
    setSentimentLoading(false);
  }
};
// =================================================

// ================= FACE EMOTION DETECTION =================
const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
useEffect(() => {
  if (!faceEmotionEnabled || askForUsername) return;

  let cancelled = false;
  let intervalId = null;

  const runFaceDetection = async () => {
    try {
      const mod = await import("@vladmandic/face-api");
      const faceapi = mod.default || mod;
      const video = localVideoref.current;
      if (!video || !video.videoWidth || !faceapi.nets?.faceExpressionNet) return;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
        .withFaceExpressions()
        .run();

      if (cancelled || !detection?.expressions) return;
      const expressions = detection.expressions;
      const entries = Object.entries(expressions);
      const top = entries.sort((a, b) => b[1] - a[1])[0];
      if (top && top[1] > 0.1) setFaceEmotion(top[0]);
    } catch (err) {
      if (!cancelled) setFaceEmotion(null);
    }
  };

  const init = async () => {
    try {
      const mod = await import("@vladmandic/face-api");
      const faceapi = mod.default || mod;
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      if (!cancelled) setFaceModelsLoaded(true);
      intervalId = setInterval(runFaceDetection, 2000);
    } catch (err) {
      console.warn("Face models not loaded. Add model files to public/models.", err);
      if (!cancelled) setFaceModelsLoaded(false);
    }
  };

  init();
  return () => {
    cancelled = true;
    if (intervalId) clearInterval(intervalId);
  };
}, [faceEmotionEnabled, askForUsername]);
// =================================================

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
    // 2️⃣ Build meeting context (chat + live transcript)
    const chatPart =
      messages && messages.length > 0
        ? messages.map((m) => `${m.sender}: ${m.data}`).join("\n")
        : "";
    const transcriptPart =
      liveTranscript.length > 0 ? "\n[Live transcript]\n" + liveTranscript.join("\n") : "";
    const meetingContext =
      (chatPart || transcriptPart) ? (chatPart + transcriptPart).trim() : "No meeting messages yet.";

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

    const meetingCode = getMeetingCodeFromPath();

    const chatPart =
      messages.length > 0
        ? messages.map((m) => `${m.sender}: ${m.data}`).join("\n")
        : "";
    const transcriptPart =
      liveTranscript.length > 0
        ? "\n[Live transcript]\n" + liveTranscript.join("\n")
        : "";
    const meetingContext =
      (chatPart || transcriptPart)
        ? (chatPart + transcriptPart).trim()
        : "No meeting messages yet.";

    const res = await fetch(`${server_url}/api/v1/ai/summarize-tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingContext }),
    });

    const aiData = await res.json();

    if (!res.ok) {
      console.log("❌ AI summarize failed:", aiData);
      return;
    }

    // ✅ tasks clean fix
    let tasksList = aiData?.tasks || [];

    if (Array.isArray(tasksList) && tasksList.length === 1 && tasksList[0] === "[]") {
      tasksList = [];
    }
    if (typeof tasksList === "string" && tasksList === "[]") {
      tasksList = [];
    }

    if (Array.isArray(tasksList) && tasksList.length === 1 && tasksList[0].toLowerCase() === "none") {
      tasksList = [];
    }

    let decisionsList = aiData?.decisions || [];
    if (!Array.isArray(decisionsList)) decisionsList = [];

    setTasks(tasksList);

    const saveRes = await fetch(`${server_url}/api/v1/meeting/save-summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        meetingCode,
        meetingContext,
        summary: aiData?.summary || "",
        actionItems: tasksList,
        decisions: decisionsList,
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

  try {
    const chatPart =
      messages && messages.length > 0
        ? messages.map((m) => `${m.sender}: ${m.data}`).join("\n")
        : "";
    const transcriptPart =
      liveTranscript.length > 0 ? "\n[Live transcript]\n" + liveTranscript.join("\n") : "";
    const meetingContext =
      (chatPart || transcriptPart) ? (chatPart + transcriptPart).trim() : "No meeting messages yet.";

    const res = await axios.post(`${server_url}/api/v1/ai/summarize-tasks`, {
      meetingContext,
    });

    const aiData = res.data;
    let tasksList = aiData?.tasks || [];
    if (Array.isArray(tasksList) && tasksList.length === 1 && (tasksList[0] === "[]" || tasksList[0]?.toLowerCase() === "none")) {
      tasksList = [];
    }
    setTasks(tasksList);

    const token = localStorage.getItem("token");
    if (token) {
      await fetch(`${server_url}/api/v1/meeting/save-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          meetingCode: getMeetingCodeFromPath(),
          meetingContext,
          summary: aiData?.summary || "",
          actionItems: tasksList,
          decisions: aiData?.decisions || [],
        }),
      });
    }

    alert("✅ Summary & tasks saved successfully!");
    console.log(aiData);
  } catch (err) {
    console.log(err);
    alert("❌ Summary was not generated.");
  }
};








    return (
        <div>

            {askForUsername === true ?

                <div className={styles.lobbyPage}>
                  <div className={styles.lobbyCard}>
                    <div className={styles.lobbyHeader}>
                      <h2>Enter Lobby</h2>
                      <p>Choose a display name and preview your camera.</p>
                    </div>

                    <div className={styles.lobbyControls}>
                      <TextField
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{
                          "& .MuiInputBase-root": {
                            backgroundColor: "rgba(2,6,23,0.55)",
                            borderRadius: "12px",
                            color: "#E2E8F0",
                          },
                          "& .MuiInputLabel-root": { color: "#94A3B8" },
                          "& .MuiInputLabel-root.Mui-focused": { color: "#60A5FA" },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(51,65,85,0.8)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(96,165,250,0.8)",
                          },
                          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                            { borderColor: "#2563EB" },
                        }}
                      />

                      <Button
                        variant="contained"
                        onClick={connect}
                        disabled={!username.trim()}
                        className={styles.lobbyConnectBtn}
                      >
                        CONNECT
                      </Button>
                    </div>

                    <div className={styles.lobbyVideoWrap}>
                      <div className={styles.lobbyVideoLabel}>Camera preview</div>
                      <video
                        className={styles.lobbyVideo}
                        ref={localVideoref}
                        autoPlay
                        muted
                      />
                    </div>
                  </div>
                </div> :


                <div className={styles.meetVideoContainer}>

{/* ================= ZOOM CHAT ONLY ================= */}
{showModal ? (
  <div className={styles.chatRoom}>
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2>Meeting Chat</h2>
        <p className={styles.chatSubTitle}>Messages in this meeting</p>
      </div>

      <div className={styles.chattingDisplay}>
        {messages.length !== 0 ? messages.map((item, index) => (
          <div className={styles.chatMsg} key={index}>
            <div className={styles.chatMsgMeta}>
              <span className={styles.chatSender}>{item.sender}</span>
            </div>
            <div className={styles.chatBubble}>{item.data}</div>
          </div>
        )) : <p>No Messages Yet</p>}
      </div>

      <div className={styles.chattingArea}>
        <TextField
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          label="Send message"
          fullWidth
          size="small"
          sx={{
            "& .MuiInputBase-root": {
              backgroundColor: "rgba(2,6,23,0.6)",
              borderRadius: "10px",
              color: "#E5E7EB",
            },
            "& .MuiInputBase-input::placeholder": { color: "#94A3B8", opacity: 1 },
            "& .MuiInputLabel-root": { color: "#94A3B8" },
            "& .MuiInputLabel-root.Mui-focused": { color: "#60A5FA" },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#334155" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#475569" },
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#2563EB",
            },
          }}
        />
        <Button
          variant="contained"
          onClick={sendMessage}
          className={styles.chatSendBtn}
        >
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
      
      
      {/* ================= LIVE TRANSCRIPT (Speech-to-Text) ================= */}
      {sttEnabled && (
        <div className={styles.transcriptPanel}>
          <div className={styles.transcriptHeader}>
            <span>🎤 Live transcript</span>
            <button
              className={styles.aiCloseBtn}
              onClick={() => setSttEnabled(false)}
              title="Turn off"
            >
              ✖
            </button>
          </div>
          <div className={styles.transcriptContent}>
            {liveTranscript.length === 0 && !interimTranscript && (
              <p className={styles.emptyText}>Speak... (listening)</p>
            )}
            {liveTranscript.map((line, i) => (
              <p key={i} className={styles.transcriptLine}>{line}</p>
            ))}
            {interimTranscript && (
              <p className={styles.transcriptLine + " " + styles.transcriptInterim}>
                {interimTranscript}
              </p>
            )}
            {/* Voice sentiment (from transcript) */}
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className={styles.sentimentBtn}
                onClick={checkVoiceSentiment}
                disabled={sentimentLoading || (liveTranscript.length === 0 && messages.length === 0)}
              >
                {sentimentLoading ? "…" : "Check voice sentiment"}
              </button>
              {voiceSentiment && (
                <span className={styles.sentimentBadge}>
                  Voice: {voiceSentiment.label || voiceSentiment.emotion || "—"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= FACE EMOTION ================= */}
      {faceEmotionEnabled && (
        <div className={styles.transcriptPanel} style={{ left: 20, top: 250, maxHeight: 100 }}>
          <div className={styles.transcriptHeader}>
            <span>😊 Face emotion</span>
            <button
              className={styles.aiCloseBtn}
              onClick={() => { setFaceEmotionEnabled(false); setFaceEmotion(null); }}
              title="Turn off"
            >
              ✖
            </button>
          </div>
          <div className={styles.transcriptContent}>
            {!faceModelsLoaded ? (
              <p className={styles.emptyText}>Add model files to public/models (see README)</p>
            ) : faceEmotion ? (
              <p className={styles.transcriptLine}>Detected: <strong>{faceEmotion}</strong></p>
            ) : (
              <p className={styles.emptyText}>Looking for face…</p>
            )}
          </div>
        </div>
      )}

      {/* ================= TASK MANAGER DASHBOARD ================= */}
      {showTaskDashboard && (
        <div className={styles.aiChatBox} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 600, maxHeight: 500 }}>
          <div className={styles.aiHeader}>
            <span>📋 Task Manager</span>
            <button className={styles.aiCloseBtn} onClick={() => setShowTaskDashboard(false)}>
              ✖
            </button>
          </div>
          <div className={styles.aiMessages}>
            {tasks.length === 0 ? (
              <p className={styles.emptyText}>No tasks yet. Generate a summary (or end call) to create tasks.</p>
            ) : (
              <ul className={styles.taskList}>
                {tasks.map((task, idx) => (
                  <li key={idx}>{task}</li>
                ))}
              </ul>
            )}
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

  {/* ✅ LIVE TRANSCRIPT (Speech-to-Text) */}
  <IconButton
    onClick={() => setSttEnabled((v) => !v)}
    sx={{ color: sttEnabled ? "#22c55e" : "inherit" }}
    title={sttEnabled ? "Live transcript ON" : "Turn on Live transcript"}
  >
    <RecordVoiceOverIcon />
  </IconButton>

  {/* ✅ FACE EMOTION */}
  <IconButton
    onClick={() => setFaceEmotionEnabled((v) => !v)}
    sx={{ color: faceEmotionEnabled ? "#a78bfa" : "inherit" }}
    title={faceEmotionEnabled ? "Face emotion ON" : "Turn on Face emotion"}
  >
    <span style={{ fontSize: "1.5rem" }}>😊</span>
  </IconButton>

  {/* ✅ RECORDING BUTTON (Free for all) */}
  <IconButton 
    onClick={isRecording ? stopRecording : startRecording}
    sx={{
      color: isRecording ? "#ff4444" : "inherit",
      animation: isRecording ? "pulse 1.5s infinite" : "none",
      "@keyframes pulse": {
        "0%, 100%": { opacity: 1 },
        "50%": { opacity: 0.5 },
      },
    }}
    title={isRecording ? `Recording... ${formatTime(recordingTime)}` : "Start Recording"}
  >
    {isRecording ? <StopIcon /> : <FiberManualRecordIcon />}
  </IconButton>

  {/* ✅ SUMMARY BUTTON */}
  <IconButton onClick={generateSummary}>
    <RestoreIcon />
  </IconButton>

  {/* ✅ HISTORY BUTTON */}
      <IconButton onClick={() => navigate("/history")}>
      <RestoreIcon />
    </IconButton>
  
      {/* ✅ TASKS BUTTON */}
      <IconButton onClick={() => setShowTaskDashboard(true)}>
          <AssignmentIcon />
      </IconButton>
  
    <Badge badgeContent={newMessages} max={999} color="error">
      <IconButton onClick={() => setModal(!showModal)}>
        <ChatIcon />    </IconButton>
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
