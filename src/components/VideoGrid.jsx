import React, { useState, useEffect, useCallback } from "react";
import VideoDisplay from "./VideoDisplay";
import { FaExpandAlt, FaCompressAlt, FaCog } from "react-icons/fa";

function VideoGrid({ wsUrl }) {
  const [mainStream, setMainStream] = useState("main");
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [streams, setStreams] = useState({
    main: { name: "Main Camera", priority: "high", active: true },
    depth: { name: "Depth Camera", priority: "normal", active: true },
    side: { name: "Side Camera", priority: "normal", active: true },
    back: { name: "Back Camera", priority: "normal", active: true },
  });

  // Track active streams and their performance
  const [streamMetrics, setStreamMetrics] = useState({});

  // Handle stream selection
  const handleStreamClick = (streamId) => {
    if (streamId !== mainStream) {
      setMainStream(streamId);
    }
  };

  // Toggle secondary streams collapse
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Toggle stream active state
  const toggleStream = (streamId) => {
    setStreams((prev) => ({
      ...prev,
      [streamId]: {
        ...prev[streamId],
        active: !prev[streamId].active,
      },
    }));
  };

  // Update stream metrics
  const updateMetrics = useCallback((streamId, metrics) => {
    setStreamMetrics((prev) => ({
      ...prev,
      [streamId]: {
        ...prev[streamId],
        ...metrics,
        lastUpdate: Date.now(),
      },
    }));
  }, []);

  // Monitor stream health
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      Object.entries(streamMetrics).forEach(([streamId, metrics]) => {
        if (now - metrics.lastUpdate > 5000) {
          console.warn(`Stream ${streamId} may be stalled`);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [streamMetrics]);

  // Add error handling for stream failures
  const handleStreamError = useCallback((streamId, error) => {
    console.error(`Stream ${streamId} error:`, error);
    setStreamMetrics((prev) => ({
      ...prev,
      [streamId]: {
        ...prev[streamId],
        error: true,
        lastError: error.message,
      },
    }));
  }, []);

  const activeStreams = Object.entries(streams).filter(
    ([_, info]) => info.active
  );

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Main Stream Container */}
      <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        <VideoDisplay
          wsUrl={`${wsUrl}?type=operator&streamId=${mainStream}`}
          streamId={mainStream}
          isMain={true}
          onMetricsUpdate={(metrics) => updateMetrics(mainStream, metrics)}
        />

        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700"
          >
            <FaCog />
          </button>
          <button
            onClick={toggleCollapse}
            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700"
          >
            {collapsed ? <FaExpandAlt /> : <FaCompressAlt />}
          </button>
        </div>

        {/* Stream Name */}
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded">
          {streams[mainStream]?.name}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-4 right-16 bg-white rounded-lg shadow-lg p-4 z-10">
          <h3 className="text-lg font-semibold mb-2">Stream Settings</h3>
          <div className="space-y-2">
            {Object.entries(streams).map(([id, info]) => (
              <div key={id} className="flex items-center justify-between">
                <span>{info.name}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={info.active}
                    onChange={() => toggleStream(id)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secondary Streams */}
      {!collapsed && (
        <div
          className={`grid gap-4 ${getGridColumns(activeStreams.length - 1)}`}
        >
          {activeStreams
            .filter(([id]) => id !== mainStream)
            .map(([id, info]) => (
              <div
                key={id}
                onClick={() => handleStreamClick(id)}
                className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden 
                         cursor-pointer transform hover:scale-105 transition-transform"
              >
                <VideoDisplay
                  wsUrl={`${wsUrl}?type=operator&streamId=${id}`}
                  streamId={id}
                  isMain={false}
                  onMetricsUpdate={(metrics) => updateMetrics(id, metrics)}
                  onError={(error) => handleStreamError(id, error)}
                />
                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {info.name}
                </div>

                {/* Performance Indicator */}
                {streamMetrics[id]?.avgLatency > 100 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                    High Latency
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// Helper function to determine grid columns based on stream count
const getGridColumns = (count) => {
  if (count <= 2) return "grid-cols-2";
  if (count <= 3) return "grid-cols-3";
  if (count <= 4) return "grid-cols-4";
  return "grid-cols-5";
};

export default VideoGrid;
