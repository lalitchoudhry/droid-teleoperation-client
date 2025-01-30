import React from "react";

function VideoControls({ settings, onSettingsChange }) {
  const presets = {
    low: { quality: 0.3, frameRate: 15 },
    medium: { quality: 0.5, frameRate: 30 },
    high: { quality: 0.8, frameRate: 60 },
  };

  return (
    <div className="video-controls bg-white p-4 rounded-lg">
      <div className="mb-4">
        <h3 className="font-semibold">Quick Settings</h3>
        <div className="flex gap-2 mt-2">
          {Object.entries(presets).map(([name, preset]) => (
            <button
              key={name}
              onClick={() => onSettingsChange(preset)}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              {name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Existing controls */}
    </div>
  );
}

export default VideoControls;
