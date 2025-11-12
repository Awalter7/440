import { useState, useEffect, useRef } from "react";

export default function useAnimationProgress() {
  const [progress, setProgress] = useState({});
  const animationFramesRef = useRef({});
  const startTimesRef = useRef({});
  const delayTimeoutsRef = useRef({});

  // New ~ use for dual animations
  function stopProgress(id){
    if(!(id in progress)){
      return;
    }

    // Cancel animation frame if exists
    if (animationFramesRef.current[id]) {
      cancelAnimationFrame(animationFramesRef.current[id]);
      delete animationFramesRef.current[id];
    }
    
    // Clear timeout if exists
    if (delayTimeoutsRef.current[id]) {
      clearTimeout(delayTimeoutsRef.current[id]);
      delete delayTimeoutsRef.current[id];
    }
    
    // Clear start time
    delete startTimesRef.current[id];

    setProgress(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  }

  function startProgress(id, duration, delay = 0) {    
    if(id in progress){
      return;
    }

    // Initialize progress to 0
    setProgress(prev => ({
      ...prev,
      [id]: 0
    }));

    const animate = (currentTime) => {
      if(!startTimesRef.current[id]){
        startTimesRef.current[id] = currentTime;
      }

      const elapsed = currentTime - startTimesRef.current[id];
      const newProgress = Math.min(elapsed / duration, 1);

      setProgress(prev => ({
        ...prev,
        [id]: newProgress
      }));

      if (newProgress < 1) {
        animationFramesRef.current[id] = requestAnimationFrame(animate);
      } else {
        delete animationFramesRef.current[id];
        delete startTimesRef.current[id];
      }
    }

    // Actually START the animation after the delay
    delayTimeoutsRef.current[id] = setTimeout(() => {
      delete delayTimeoutsRef.current[id];
      animationFramesRef.current[id] = requestAnimationFrame(animate);
    }, delay);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(animationFramesRef.current).forEach(frameId => {
        cancelAnimationFrame(frameId);
      });
      Object.values(delayTimeoutsRef.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
  }, []);


  //Old ~ used for single animation

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

  return { progress, stopProgress, startProgress, isProgressing: Object.keys(progress).length > 0};
}