import { useEffect, useState } from "preact/hooks";

export function useAfterFirstPaint(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let firstFrame = 0;
    let secondFrame = 0;

    const schedule = typeof window.requestAnimationFrame === "function"
      ? window.requestAnimationFrame.bind(window)
      : (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 16);
    const cancel = typeof window.cancelAnimationFrame === "function"
      ? window.cancelAnimationFrame.bind(window)
      : (id: number) => window.clearTimeout(id);

    firstFrame = schedule(() => {
      secondFrame = schedule(() => setReady(true));
    });

    return () => {
      if (firstFrame) cancel(firstFrame);
      if (secondFrame) cancel(secondFrame);
    };
  }, []);

  return ready;
}

export function useDebouncedValue<T>(value: T, delayMs = 120): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
