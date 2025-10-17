"use client"
import React, { useRef, useEffect, useState } from "react";
import {useProgress} from "@react-three/drei";
import easingFunctions from "../../utils/easingFunctions";

function PlasmicEffect({ 
  initialPositions, 
  loadEffect, 
  clickEffects,
  camera = false,
  children 
}) {
  const { progress } = useProgress();
  const elementRef = useRef();
  
  // State to track current element values
  const [elementState, setElementState] = useState(() => {
    const initial = initialPositions?.[0];
    return {
      position: initial?.position || { x: 0, y: 0, z: 0 },
      rotation: initial?.rotation || { x: 0, y: 0, z: 0 },
      fov: camera && initial?.fov !== undefined ? initial.fov : 25
    };
  });

  // Track active click effect
  const [activeEffect, setActiveEffect] = useState("");
  const [clickEffectProgress, setClickEffectProgress] = useState(0);
  const clickEffectAnimationFrames = useRef({});

  // Track load effect
  const [loadEffectProgress, setLoadEffectProgress] = useState(0);
  const loadEffectAnimationFrame = useRef({});
  const loadStartTime = useRef(null);

  // Helper to interpolate numeric values
  const interpolateValue = (start, end, progress, easing) => {
    const easedProgress = easing ? easing(progress) : progress;
    return start + (end - start) * easedProgress;
  };

  // Load Effect Animation
  useEffect(() => {
    if (progress !== 100 || !loadEffect || loadEffect.length === 0) return;

    const effect = loadEffect[0];
    if (!effect || loadEffectAnimationFrame.current["load"]) return;

    const effectDelay = effect.delay || 0;
    const effectDuration = effect.duration || 1000;
    let delayTimeoutId = null;

    const animate = (currentTime) => {
      if (!loadStartTime.current) {
        loadStartTime.current = currentTime;
      }

      const elapsed = currentTime - loadStartTime.current;
      const progress = Math.min(elapsed / effectDuration, 1);

      setLoadEffectProgress(progress);

      if (progress < 1) {
        loadEffectAnimationFrame.current["load"] = requestAnimationFrame(animate);
      } else {
        // Animation complete - set final values
        setElementState(prevState => ({
          position: effect.position || prevState.position,
          rotation: effect.rotation || prevState.rotation,
          fov: camera && effect.fov !== undefined ? effect.fov : prevState.fov
        }));

        delete loadEffectAnimationFrame.current["load"];
        setLoadEffectProgress(0);
        loadStartTime.current = null;
      }
    };

    delayTimeoutId = setTimeout(() => {
      loadEffectAnimationFrame.current["load"] = requestAnimationFrame(animate);
    }, effectDelay);

    return () => {
      if (loadEffectAnimationFrame.current["load"]) {
        cancelAnimationFrame(loadEffectAnimationFrame.current["load"]);
        delete loadEffectAnimationFrame.current["load"];
      }
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
    };
  }, [progress, loadEffect, camera]);

  // Click Effect Event Listener
  useEffect(() => {
    if (!clickEffects || clickEffects.length === 0) return;

    const handleClick = (e) => {
      let element = e.target;

      while (element) {
        clickEffects.forEach((effect, index) => {
          if (effect.triggerId && element.id === effect.triggerId) {
            const effectId = `effect_${index}`;

            if (activeEffect === effectId) return;

            // If there's an active effect, capture current interpolated values
            if (activeEffect !== "" && clickEffectProgress > 0) {
              const currentEffectIndex = parseInt(activeEffect.split('_')[1]);
              const currentEffect = clickEffects[currentEffectIndex];

              if (currentEffect) {
                const currentValues = getCurrentElementValues(clickEffectProgress);
                setElementState(currentValues);
              }

              // Cancel the current animation
              if (clickEffectAnimationFrames.current[activeEffect]) {
                cancelAnimationFrame(clickEffectAnimationFrames.current[activeEffect]);
                delete clickEffectAnimationFrames.current[activeEffect];
              }
            }

            setActiveEffect(effectId);
            setClickEffectProgress(0);
          }
        });
        element = element.parentElement;
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [clickEffects, activeEffect, clickEffectProgress]);

  // Click Effect Animation Loop
  useEffect(() => {
    if (activeEffect === "") return;

    const effectIndex = parseInt(activeEffect.split('_')[1]);
    const effect = clickEffects[effectIndex];

    if (!effect || clickEffectAnimationFrames.current[activeEffect]) return;

    const startTime = { current: null };
    const effectDuration = effect.duration || 1000;
    const effectDelay = effect.delay || 0;
    let delayTimeoutId = null;

    const animate = (currentTime) => {
      if (!startTime.current) {
        startTime.current = currentTime;
      }

      const elapsed = currentTime - startTime.current;
      const progress = Math.min(elapsed / effectDuration, 1);

      setClickEffectProgress(progress);

      if (progress < 1) {
        clickEffectAnimationFrames.current[activeEffect] = requestAnimationFrame(animate);
      } else {
        // Animation complete - update with final values
        setElementState({
          position: effect.position || elementState.position,
          rotation: effect.rotation || elementState.rotation,
          fov: camera && effect.fov !== undefined ? effect.fov : elementState.fov
        });

        delete clickEffectAnimationFrames.current[activeEffect];
        setActiveEffect("");
        setClickEffectProgress(0);
      }
    };

    delayTimeoutId = setTimeout(() => {
      clickEffectAnimationFrames.current[activeEffect] = requestAnimationFrame(animate);
    }, effectDelay);

    return () => {
      Object.values(clickEffectAnimationFrames.current).forEach(frameId => {
        if (frameId) cancelAnimationFrame(frameId);
      });
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
    };
  }, [activeEffect, clickEffects, camera]);

  // Get current element values with interpolation
  const getCurrentElementValues = (progressOverride) => {
    let result = { ...elementState };

    // Apply load effect if active
    if (loadEffectProgress > 0 && loadEffectProgress < 1) {
      const effect = loadEffect?.[0];
      if (effect) {
        const easingName = effect.easingFunction || 'linear';
        const easing = easingFunctions[easingName] || easingFunctions.linear;

        if (effect.position) {
          result.position = {
            x: interpolateValue(elementState.position.x, effect.position.x, loadEffectProgress, easing),
            y: interpolateValue(elementState.position.y, effect.position.y, loadEffectProgress, easing),
            z: interpolateValue(elementState.position.z, effect.position.z, loadEffectProgress, easing)
          };
        }

        if (effect.rotation) {
          result.rotation = {
            x: interpolateValue(elementState.rotation.x, effect.rotation.x, loadEffectProgress, easing),
            y: interpolateValue(elementState.rotation.y, effect.rotation.y, loadEffectProgress, easing),
            z: interpolateValue(elementState.rotation.z, effect.rotation.z, loadEffectProgress, easing)
          };
        }

        if (camera && effect.fov !== undefined) {
          result.fov = interpolateValue(elementState.fov, effect.fov, loadEffectProgress, easing);
        }
      }
    }
    // Apply click effect if active
    else if (activeEffect !== "") {
      const idx = parseInt(activeEffect.split('_')[1]);
      const effect = clickEffects[idx];

      if (effect) {
        const easingName = effect.easingFunction || 'linear';
        const easing = easingFunctions[easingName] || easingFunctions.linear;
        const progress = progressOverride !== undefined ? progressOverride : clickEffectProgress;

        if (effect.position) {
          result.position = {
            x: interpolateValue(elementState.position.x, effect.position.x, progress, easing),
            y: interpolateValue(elementState.position.y, effect.position.y, progress, easing),
            z: interpolateValue(elementState.position.z, effect.position.z, progress, easing)
          };
        }

        if (effect.rotation) {
          result.rotation = {
            x: interpolateValue(elementState.rotation.x, effect.rotation.x, progress, easing),
            y: interpolateValue(elementState.rotation.y, effect.rotation.y, progress, easing),
            z: interpolateValue(elementState.rotation.z, effect.rotation.z, progress, easing)
          };
        }

        if (camera && effect.fov !== undefined) {
          result.fov = interpolateValue(elementState.fov, effect.fov, progress, easing);
        }
      }
    }

    return result;
  };

  const currentValues = getCurrentElementValues();

  // Update element on every frame
  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.position.set(
        currentValues.position.x,
        currentValues.position.y,
        currentValues.position.z
      );
      elementRef.current.rotation.set(
        currentValues.rotation.x,
        currentValues.rotation.y,
        currentValues.rotation.z
      );
      
      if (camera) {
        elementRef.current.fov = currentValues.fov;
        elementRef.current.updateProjectionMatrix();
      }
    }
  });

  // Clone child and pass ref
  return React.cloneElement(children, { 
    ref: elementRef,
    position: [currentValues.position.x, currentValues.position.y, currentValues.position.z],
    rotation: [currentValues.rotation.x, currentValues.rotation.y, currentValues.rotation.z],
    ...(camera && { fov: currentValues.fov })
  });
}

export default PlasmicEffect