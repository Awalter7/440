import { useState, useEffect, useRef } from "react";

export default function useAnimationProgress(update, value, duration = 1000, delay = 0) {
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  function resetProgress(){
    setProgress(0)
  }

  useEffect(() => {
    if(!value) {
      // Reset progress when value becomes false
      setProgress(0);
      return;
    }

    // Reset progress at the start of a new animation
    setProgress(0);
    console.log("here")

    let delayTimeoutId = null;

    const animate = (currentTime) => {
      if(!value) return;

      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      let newProgress = Math.min(elapsed / duration, 1);

      setProgress(newProgress);

      const shouldContinue = newProgress < 1;

      if (shouldContinue) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
        startTimeRef.current = null;
      }
    };

    delayTimeoutId = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (delayTimeoutId) {
        clearTimeout(delayTimeoutId);
      }
      startTimeRef.current = null;
    };
  }, [update, value, duration, delay]);

  return { progress, resetProgress};
}