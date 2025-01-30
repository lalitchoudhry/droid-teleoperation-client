import { useEffect, useRef, useState } from "react";

export function useWebSocket(url, options = {}) {
  const wsRef = useRef(null);
  const [status, setStatus] = useState("connecting");
  const reconnectTimeout = useRef(null);

  const connect = () => {
    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setStatus("connected");
        options.onOpen?.();
      };

      wsRef.current.onclose = () => {
        setStatus("disconnected");
        // Attempt to reconnect
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("error");
      };

      wsRef.current.onmessage = options.onMessage;
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setStatus("error");
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [url]);

  return { status, ws: wsRef.current };
}
