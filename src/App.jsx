import React, { useState } from "react";
import VideoStreamer from "./components/VideoStreamer";
import VideoDisplay from "./components/VideoDisplay";

function App() {
  const [mode, setMode] = useState(null);

  if (!mode) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-4">Robot Control System</h1>
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
            View Stream (Operator)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Robot Control System</h1>
      {mode === "stream" ? (
        <VideoStreamer wsUrl="ws://localhost:5000" />
      ) : (
        <VideoDisplay wsUrl="ws://localhost:5000" />
      )}
    </div>
  );
}

export default App;
