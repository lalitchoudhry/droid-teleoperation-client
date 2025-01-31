import React from "react";
import { useStream } from "../contexts/StreamContext";

function StreamSettings({ streamId }) {
  const { state, actions } = useStream();

  const handleFrameRateChange = (e) => {
    const frameRate = parseInt(e.target.value, 10);
    actions.updateSettings({
      ...state.settings,
      frameRate,
    });
  };

  const handleQualityChange = (e) => {
    const quality = parseFloat(e.target.value);
    actions.updateSettings({
      ...state.settings,
      quality,
    });
  };

  const handleResolutionChange = (e) => {
    const [width, height] = e.target.value.split("x").map(Number);
    actions.updateSettings({
      ...state.settings,
      resolution: { width, height },
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">Stream Settings</h3>

      <div className="space-y-4">
        {/* Frame Rate Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frame Rate: {state.settings.frameRate} fps
          </label>
          <input
            type="range"
            min="1"
            max="60"
            value={state.settings.frameRate}
            onChange={handleFrameRateChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 fps</span>
            <span>30 fps</span>
            <span>60 fps</span>
          </div>
        </div>

        {/* Quality Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quality: {(state.settings.quality * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={state.settings.quality}
            onChange={handleQualityChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>

        {/* Resolution Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resolution
          </label>
          <select
            value={`${state.settings.resolution.width}x${state.settings.resolution.height}`}
            onChange={handleResolutionChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="640x480">640x480 (VGA)</option>
            <option value="1280x720">1280x720 (HD)</option>
            <option value="1920x1080">1920x1080 (Full HD)</option>
          </select>
        </div>

        {/* Status and Error Display */}
        {state.errors.get(streamId) && (
          <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
            {state.errors.get(streamId).message}
          </div>
        )}
      </div>

      {/* Current Settings Display */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="p-2 bg-gray-50 rounded">
          <p>Current Settings:</p>
          <ul className="list-disc list-inside">
            <li>
              Resolution: {state.settings.resolution.width}x
              {state.settings.resolution.height}
            </li>
            <li>Frame Rate: {state.settings.frameRate} fps</li>
            <li>Quality: {(state.settings.quality * 100).toFixed(0)}%</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StreamSettings;
