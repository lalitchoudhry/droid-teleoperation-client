import React, { useEffect, useState } from "react";

function NetworkMonitor() {
  const [quality, setQuality] = useState({
    latency: 0,
    bandwidth: 0,
  });

  useEffect(() => {
    const checkNetwork = async () => {
      const start = performance.now();
      try {
        await fetch("/ping");
        const latency = performance.now() - start;
        setQuality((prev) => ({ ...prev, latency }));
      } catch (error) {
        console.error("Network check failed:", error);
      }
    };

    const interval = setInterval(checkNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="network-stats">
      <div>Latency: {quality.latency.toFixed(2)}ms</div>
      <div
        className={`quality-indicator ${
          quality.latency < 100 ? "good" : "poor"
        }`}
      />
    </div>
  );
}

export default NetworkMonitor;
