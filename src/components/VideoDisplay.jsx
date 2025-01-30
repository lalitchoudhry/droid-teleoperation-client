import React, { useEffect, useRef, useState } from "react";

function VideoDisplay({ wsUrl }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [status, setStatus] = useState("Connecting...");
  const [stats, setStats] = useState({
    framesReceived: 0,
    avgLatency: 0,
  });

  useEffect(() => {
    wsRef.current = new WebSocket(wsUrl);
    let frameCount = 0;
    let lastTime = Date.now();

    wsRef.current.onopen = () => {
      setStatus("Connected, waiting for video...");
    };

    wsRef.current.onmessage = async (event) => {
      try {
        const receiveTime = Date.now();
        frameCount++;

        // Update stats every second
        if (receiveTime - lastTime >= 1000) {
          setStats((prev) => ({
            ...prev,
            framesReceived: frameCount,
          }));
          frameCount = 0;
          lastTime = receiveTime;
        }

        const blob = event.data;
        const imageBitmap = await createImageBitmap(blob);
        const ctx = canvasRef.current.getContext("2d");
        ctx.drawImage(imageBitmap, 0, 0);
        setStatus("Receiving video stream");
      } catch (error) {
        console.error("Error displaying frame:", error);
        setStatus("Error displaying frame");
      }
    };

    wsRef.current.onclose = () => {
      setStatus("Connection closed");
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl]);

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-lg overflow-hidden shadow-lg bg-white p-2 mb-4">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="rounded-lg shadow-lg"
        />
        <div className="mt-2 text-center text-blue-600">{status}</div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg w-[640px]">
        <h3 className="text-lg font-semibold mb-2">Stream Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Frames Received:</span>
            <span className="ml-2">{stats.framesReceived} FPS</span>
          </div>
          <div>
            <span className="font-medium">Connection Status:</span>
            <span className="ml-2">{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoDisplay;
