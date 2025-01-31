import React, { useState, useEffect } from "react";
import VideoStreamer from "./components/VideoStreamer";
import VideoDisplay from "./components/VideoDisplay";
import MultiStreamDisplay from "./components/MultiStreamDisplay";

const WS_URL = "ws://localhost:5000";

function App() {
  const [mode, setMode] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [status, setStatus] = useState("");

  const [isMobile] = useState(() => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  });

  const detectCameras = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          isMobile
            ? "Your mobile browser doesn't support camera access"
            : "Your browser does not support media devices API"
        );
      }

      // Request initial permissions
      await navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
        });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      console.log("Available video devices:", videoDevices);

      if (videoDevices.length === 0) {
        throw new Error("No video devices found");
      }

      const cameraDetails = await Promise.all(
        videoDevices.map(async (device) => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: device.deviceId },
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 },
              },
            });

            stream.getTracks().forEach((track) => track.stop());

            return {
              id: device.deviceId,
              label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
              isRealSense: device.label.toLowerCase().includes("realsense"),
            };
          } catch (err) {
            console.warn(`Failed to test camera ${device.deviceId}:`, err);
            return null;
          }
        })
      );

      const validCameras = cameraDetails.filter((camera) => camera !== null);
      setCameras(validCameras);

      if (validCameras.length === 0) {
        setStatus("No cameras detected or all cameras are in use");
      }
    } catch (err) {
      console.error("Camera detection error:", err);
      setStatus(
        isMobile
          ? "Please allow camera access on your mobile device"
          : "Camera permission denied or not available"
      );
    }
  };

  useEffect(() => {
    detectCameras();

    // Listen for device changes
    navigator.mediaDevices.addEventListener("devicechange", detectCameras);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", detectCameras);
    };
  }, []);

  if (!mode) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-4">Robot Control System</h1>
        <div className="space-y-4">
          <div className="space-x-4">
            <button
              onClick={() => setMode("stream")}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Start Streaming (Robot)
            </button>
            <button
              onClick={() => setMode("view")}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              View Single Stream (Operator)
            </button>
            {/* Add new button for multi-stream view */}
            <button
              onClick={() => setMode("multi-view")}
              className="bg-purple-500 text-white px-4 py-2 rounded"
            >
              View All Streams
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If mode is multi-view, show all streams
  if (mode === "multi-view") {
    return (
      <div className="min-h-screen bg-gray-100">
        <MultiStreamDisplay wsUrl={WS_URL} />
      </div>
    );
  }

  // Rest of your existing code...
  if (mode && !selectedCamera && mode !== "multi-view") {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
        <h2 className="text-xl mb-4">Select Camera</h2>
        <div className="space-y-2 w-full max-w-md">
          {cameras.map((camera) => (
            <button
              key={camera.id}
              onClick={() => setSelectedCamera(camera.id)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                       transition-colors flex items-center justify-between"
            >
              <span>{camera.label}</span>
              {camera.isRealSense && (
                <span className="ml-2 px-2 py-1 bg-green-500 text-xs rounded">
                  RealSense
                </span>
              )}
            </button>
          ))}
          {cameras.length === 0 && (
            <div className="text-center space-y-4">
              <div className="text-red-500 p-4">
                {status || "No cameras available"}
              </div>
              <button
                onClick={detectCameras}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry Camera Detection
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Robot Control System</h1>
      {mode === "stream" ? (
        <VideoStreamer wsUrl={WS_URL} streamId={selectedCamera} />
      ) : (
        <VideoDisplay wsUrl={WS_URL} streamId={selectedCamera} />
      )}
    </div>
  );
}

export default App;
