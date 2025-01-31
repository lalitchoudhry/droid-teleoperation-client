import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useStream } from "../contexts/StreamContext";
import StreamSettings from "./StreamSettings";

function VideoStreamer({ wsUrl, streamId }) {
  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const [settings, setSettings] = useState({
    quality: 0.5,
    frameRate: 30,
  });
  const peerId = useRef(uuidv4());
  const canvasRef = useRef(null);

  const { state, actions } = useStream();

  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    let reconnectTimeout;

    const connect = () => {
      wsRef.current = new WebSocket(wsUrl);
      setupWebSocket();
    };

    const handleReconnect = () => {
      console.log("Attempting to reconnect...");
      reconnectTimeout = setTimeout(connect, 3000);
    };

    wsRef.current = new WebSocket(wsUrl);
    setupWebSocket();

    wsRef.current.onclose = () => {
      console.log("WebSocket closed, attempting reconnect...");
      handleReconnect();
    };

    startVideo().then(() => {
      sendFrames();
    });

    return () => {
      clearTimeout(reconnectTimeout);
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionsRef.current.forEach((pc) => pc.close());
      wsRef.current?.close();
    };
  }, [wsUrl, streamId]);

  const startVideo = async () => {
    try {
      console.log("Starting video with streamId:", streamId);

      if (!streamId) {
        throw new Error("No camera ID provided");
      }

      const constraints = {
        video: {
          deviceId: { exact: streamId },
          width: { ideal: state.settings.resolution.width },
          height: { ideal: state.settings.resolution.height },
          frameRate: { ideal: state.settings.frameRate, max: 30 },
        },
        audio: false,
      };

      console.log("Attempting to get media with constraints:", constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log("Stream obtained successfully");
      actions.addStream(streamId, stream);
      actions.clearError(streamId);

      localStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      peerConnectionsRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find(
          (sender) => sender.track?.kind === "video"
        );
        if (videoSender) {
          videoSender.replaceTrack(stream.getVideoTracks()[0]);
        }
      });

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log("Video track settings:", settings);

      setStatus("Camera ready");
    } catch (err) {
      console.error("Error accessing camera:", err);
      actions.setError(streamId, err);

      if (err.name === "NotAllowedError") {
        setStatus("Camera access denied - please check permissions");
      } else if (err.name === "NotFoundError") {
        setStatus(`Camera ${streamId} not found or disconnected`);
      } else if (err.name === "NotReadableError") {
        setStatus("Camera is in use by another application");
      } else {
        setStatus(`Camera error: ${err.message}`);
      }
    }
  };

  const setupWebSocket = () => {
    wsRef.current.onopen = () => {
      wsRef.current.send(
        JSON.stringify({
          type: "register",
          role: "streamer",
          streamId: streamId,
        })
      );
      console.log("Connected to server");
    };
  };

  const sendFrames = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.width = 640;
    canvas.height = 480;

    let frameCount = 0;
    let lastTime = Date.now();

    const sendFrame = () => {
      if (videoRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        frameCount++;
        const now = Date.now();

        if (now - lastTime >= 1000) {
          setStatus(`Streaming at ${frameCount} FPS`);
          frameCount = 0;
          lastTime = now;
        }

        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            wsRef.current.send(blob);
          },
          "image/jpeg",
          settings.quality
        );
      }
      setTimeout(() => {
        requestAnimationFrame(sendFrame);
      }, 1000 / settings.frameRate);
    };

    sendFrame();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" width={640} height={480} />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  status.includes("Streaming")
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                } animate-pulse`}
              />
              <span className="text-white text-sm font-medium">{status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <StreamSettings streamId={streamId} />
      </div>
    </div>
  );
}

export default VideoStreamer;
