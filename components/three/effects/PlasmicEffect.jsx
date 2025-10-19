"use client"
import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useProgress } from "@react-three/drei";
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
  
  // Memoize initial state
  const initialState = useMemo(() => {
    const initial = initialPositions?.[0];
    return {
      position: initial?.position || { x: 0, y: 0, z: 0 },
      rotation: initial?.rotation || { x: 0, y: 0, z: 0 },
      fov: camera && initial?.fov !== undefined ? initial.fov : 25
    };
  }, [initialPositions, camera]);

  const [elementState, setElementState] = useState(initialState);
  const [activeEffect, setActiveEffect] = useState("");
  const [clickEffectProgress, setClickEffectProgress] = useState(0);
  const [loadEffectProgress, setLoadEffectProgress] = useState(0);
  
  const clickEffectAnimationFrames = useRef({});
  const loadEffectAnimationFrame = useRef({});
  const loadStartTime = useRef(null);

  // Memoize interpolation function
  const interpolateValue = useCallback((start, end, progress, easing) => {
    const easedProgress = easing ? easing(progress) : progress;
    return start + (end - start) * easedProgress;
  }, []);

  // Memoize getCurrentElementValues to prevent recreation
  const getCurrentElementValues = useCallback((progressOverride) => {
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
  }, [elementState, loadEffectProgress, activeEffect, clickEffectProgress, loadEffect, clickEffects, camera, interpolateValue]);

  // Memoize current values - only recalculate when dependencies change
  const currentValues = useMemo(() => getCurrentElementValues(), [getCurrentElementValues]);

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

  // Memoize click handler
  const handleClick = useCallback((e) => {
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
  }, [clickEffects, activeEffect, clickEffectProgress, getCurrentElementValues]);

  // Click Effect Event Listener
  useEffect(() => {
    if (!clickEffects || clickEffects.length === 0) return;

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [clickEffects, handleClick]);

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
  }, [activeEffect, clickEffects, camera, elementState]);

  // Update element on every frame - using useEffect with specific dependencies
  useEffect(() => {
    if (elementRef.current) {
      const { position, rotation, fov } = currentValues;
      
      elementRef.current.position.set(position.x, position.y, position.z);
      elementRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
      
      if (camera) {
        elementRef.current.fov = fov;
        elementRef.current.updateProjectionMatrix();
      }
    }
  }, [currentValues, camera]);

  // Memoize cloned element
  const clonedElement = useMemo(() => {
    return React.cloneElement(children, { 
      ref: elementRef,
      position: [currentValues.position.x, currentValues.position.y, currentValues.position.z],
      rotation: [currentValues.rotation.x, currentValues.rotation.y, currentValues.rotation.z],
      ...(camera && { fov: currentValues.fov })
    });
  }, [children, currentValues, camera]);

  return clonedElement;
}

export default PlasmicEffect;