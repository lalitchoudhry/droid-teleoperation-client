import React, { useEffect, useRef, useState, useCallback } from "react";

function VideoDisplay({ wsUrl, streamId }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const requestAnimationFrameRef = useRef();

  const [status, setStatus] = useState("Connecting...");
  const [stats, setStats] = useState({
    framesReceived: 0,
    avgLatency: 0,
    droppedFrames: 0,
  });

  // Optimize frame rendering
  const renderFrame = useCallback(async (blob) => {
    try {
      const imageBitmap = await createImageBitmap(blob);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d", {
          alpha: false,
          desynchronized: true, // Optimize canvas performance
        });

        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrameRef.current = requestAnimationFrame(() => {
          ctx.drawImage(imageBitmap, 0, 0);
        });
      }
    } catch (error) {
      console.error("Frame render error:", error);
      stats.droppedFrames++;
    }
  }, []);

  useEffect(() => {
    let isConnected = true;

    const connect = () => {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.binaryType = "blob"; // Optimize for binary data

      wsRef.current.onopen = () => {
        if (!isConnected) return;
        wsRef.current.send(
          JSON.stringify({
            type: "register",
            role: "viewer",
            streamId: streamId,
          })
        );
        setStatus("Connected, waiting for video...");
      };

      wsRef.current.onmessage = async (event) => {
        if (!isConnected) return;

        try {
          frameCountRef.current++;
          const now = Date.now();

          // Update stats every second
          if (now - lastTimeRef.current >= 1000) {
            setStats((prev) => ({
              ...prev,
              framesReceived: frameCountRef.current,
              avgLatency: now - lastTimeRef.current - 1000,
            }));
            frameCountRef.current = 0;
            lastTimeRef.current = now;
          }

          if (event.data instanceof Blob) {
            await renderFrame(event.data);
            setStatus("Receiving video stream");
          } else {
            const message = JSON.parse(event.data);
            // Handle control messages if needed
          }
        } catch (error) {
          console.error("Message handling error:", error);
          setStatus("Error processing message");
        }
      };

      wsRef.current.onclose = () => {
        if (!isConnected) return;
        setStatus("Connection closed");
        // Attempt reconnection
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      isConnected = false;
      if (requestAnimationFrameRef.current) {
        cancelAnimationFrame(requestAnimationFrameRef.current);
      }
      wsRef.current?.close();
    };
  }, [wsUrl, streamId, renderFrame]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="rounded-xl shadow-lg bg-neutral-900"
      />

      <div className="absolute bottom-4 left-4 gap-2 flex items-center justify-between bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              status.includes("Receiving") ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span className="text-white text-sm font-medium">{status}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">FPS:</span>
            <span className="text-white text-sm font-medium">
              {stats.framesReceived}
            </span>
          </div>
          {stats.avgLatency > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">Latency:</span>
              <span className="text-white text-sm font-medium">
                {stats.avgLatency}ms
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(VideoDisplay);
