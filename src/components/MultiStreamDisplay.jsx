import React, { useState, useEffect, useCallback } from "react";
import VideoDisplay from "./VideoDisplay";
import { useStream } from "../contexts/StreamContext";

function MultiStreamDisplay({ wsUrl }) {
  const { state, actions } = useStream();
  const [activeStreams, setActiveStreams] = useState([]);
  const [status, setStatus] = useState("Connecting...");

  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === "active-streams") {
        setActiveStreams((prev) => {
          // Only update if streams have changed
          const newStreams = message.streams;
          return JSON.stringify(prev) !== JSON.stringify(newStreams)
            ? newStreams
            : prev;
        });
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }, []);

  useEffect(() => {
    let isConnected = true;
    let reconnectTimeout;

    const connect = () => {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!isConnected) return;
        ws.send(
          JSON.stringify({
            type: "register",
            role: "multi-viewer",
            streamId: "all",
          })
        );
        setStatus("Connected");
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        if (!isConnected) return;
        setStatus("Disconnected");
        // Attempt reconnection
        reconnectTimeout = setTimeout(connect, 3000);
      };

      return ws;
    };

    const ws = connect();

    return () => {
      isConnected = false;
      clearTimeout(reconnectTimeout);
      ws.close();
    };
  }, [wsUrl, handleMessage]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1920px] mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-light text-gray-900">Live Streams</h1>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  status === "Connected" ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-gray-600">{status}</span>
            </div>
          </div>
        </header>

        {activeStreams.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <p className="text-xl text-gray-400 mb-2">No Active Streams</p>
              <p className="text-sm text-gray-400">
                Waiting for streamers to connect...
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {activeStreams.map((streamId) => (
              <div key={streamId} className="aspect-video">
                <VideoDisplay
                  wsUrl={wsUrl}
                  streamId={streamId}
                  onStreamStart={() =>
                    console.log(`Stream ${streamId} started`)
                  }
                  onDisconnect={() =>
                    console.log(`Stream ${streamId} disconnected`)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(MultiStreamDisplay);
