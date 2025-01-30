import React, { useState, useEffect, useRef } from "react";

function VideoStreamer({ wsUrl }) {
  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const [settings, setSettings] = useState({
    quality: 0.5,
    frameRate: 30,
  });

  useEffect(() => {
    canvasRef.current = document.createElement("canvas");
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("Connected to server");
      startVideo();
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          sendFrames();
        };
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
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

        // Calculate and show FPS every second
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
    <div className="flex flex-col items-center">
      <div className="rounded-lg overflow-hidden shadow-lg bg-white p-2 mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-[640px] h-[480px] object-cover"
        />
        <div className="mt-2 text-center text-green-600">{status}</div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg w-[640px]">
        <h3 className="text-lg font-semibold mb-2">Stream Settings</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Quality: {settings.quality * 100}%
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={settings.quality}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                quality: parseFloat(e.target.value),
              }))
            }
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Frame Rate: {settings.frameRate} FPS
          </label>
          <input
            type="range"
            min="1"
            max="60"
            value={settings.frameRate}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                frameRate: parseInt(e.target.value),
              }))
            }
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default VideoStreamer;
