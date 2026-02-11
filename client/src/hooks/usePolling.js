import { useEffect, useRef } from 'react';

export default function usePolling(callback, intervalMs, enabled = true) {
  const callbackRef = useRef(callback);

  // Keep callback ref current without restarting the interval
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      try {
        await callbackRef.current();
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
