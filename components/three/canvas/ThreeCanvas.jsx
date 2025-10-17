// ThreeCanvas.jsx
"use client"
import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, PerspectiveCamera, useProgress } from "@react-three/drei";
import OrbitalRig from "../rigs/OrbitalRig";
import LanderScene from "../scenes/LanderScene";
import * as THREE from 'three';
import easingFunctions from "../../utils/easingFunctions";

// Camera controller component that handles all animations
function CameraController({ 
  initialPositions, 
  loadEffects, 
  clickEffects 
}) {
  const { progress } = useProgress();
  const cameraRef = useRef();
  
  // State to track current object states (position, rotation, fov)
  const [objectStates, setObjectStates] = useState({});
  
  // Load effect state
  const [activeLoadEffects, setActiveLoadEffects] = useState([]);
  const [loadEffectProgress, setLoadEffectProgress] = useState({});
  const loadEffectFrames = useRef({});
  const loadEffectStartTimes = useRef({});
  
  // Click effect state
  const [activeClickEffects, setActiveClickEffects] = useState([]);
  const [clickEffectProgress, setClickEffectProgress] = useState({});
  const clickEffectFrames = useRef({});
  const clickEffectStartTimes = useRef({});

  // Initialize object states from initialPositions
  useEffect(() => {
    if (!initialPositions || initialPositions.length === 0) return;
    
    const states = {};
    initialPositions.forEach(init => {
      states[init.object] = {
        position: init.position || { x: 0, y: 0, z: 0 },
        rotation: init.rotation || { x: 0, y: 0, z: 0 },
        fov: init.fov
      };
    });
    
    setObjectStates(states);
  }, [initialPositions]);

  // Trigger load effects when progress reaches 100
  useEffect(() => {
    if (progress !== 100 || !loadEffects || loadEffects.length === 0) return;
    if (activeLoadEffects.length > 0) return; // Already triggered
    
    const effectsToActivate = loadEffects.map((effect, index) => ({
      ...effect,
      id: `load_${index}`
    }));
    
    setActiveLoadEffects(effectsToActivate);
  }, [progress, loadEffects]);

  // Animate active load effects
  useEffect(() => {
    if (activeLoadEffects.length === 0) return;

    activeLoadEffects.forEach(effect => {
      if (loadEffectFrames.current[effect.id]) return; // Already animating

      const effectDelay = effect.delay || 0;
      const effectDuration = effect.duration || 1000;

      const animate = (currentTime) => {
        if (!loadEffectStartTimes.current[effect.id]) {
          loadEffectStartTimes.current[effect.id] = currentTime;
        }

        const elapsed = currentTime - loadEffectStartTimes.current[effect.id];
        const progress = Math.min(elapsed / effectDuration, 1);

        setLoadEffectProgress(prev => ({ ...prev, [effect.id]: progress }));

        if (progress < 1) {
          loadEffectFrames.current[effect.id] = requestAnimationFrame(animate);
        } else {
          // Animation complete - commit final values
          setObjectStates(prevStates => {
            const updated = { ...prevStates };
            const objState = updated[effect.object] || {};
            
            if (effect.position) objState.position = effect.position;
            if (effect.rotation) objState.rotation = effect.rotation;
            if (effect.fov !== undefined) objState.fov = effect.fov;
            
            updated[effect.object] = objState;
            return updated;
          });

          // Cleanup
          delete loadEffectFrames.current[effect.id];
          delete loadEffectStartTimes.current[effect.id];
          
          setActiveLoadEffects(prev => prev.filter(e => e.id !== effect.id));
        }
      };

      const timeoutId = setTimeout(() => {
        loadEffectFrames.current[effect.id] = requestAnimationFrame(animate);
      }, effectDelay);

      // Store timeout for cleanup
      loadEffectFrames.current[`${effect.id}_timeout`] = timeoutId;
    });

    return () => {
      Object.entries(loadEffectFrames.current).forEach(([key, value]) => {
        if (key.includes('_timeout')) {
          clearTimeout(value);
        } else {
          cancelAnimationFrame(value);
        }
      });
    };
  }, [activeLoadEffects]);

  // Handle click triggers for click effects
  useEffect(() => {
    if (!clickEffects || clickEffects.length === 0) return;

    const handleClick = (e) => {
      let element = e.target;

      while (element) {
        clickEffects.forEach((effect, index) => {
          if (effect.triggerId && element.id === effect.triggerId) {
            const effectId = `click_${index}_${Date.now()}`;
            
            // Capture current state if there's an active animation
            const existingActiveEffect = activeClickEffects.find(
              ae => ae.object === effect.object
            );
            
            if (existingActiveEffect) {
              // Cancel existing animation for this object
              if (clickEffectFrames.current[existingActiveEffect.id]) {
                cancelAnimationFrame(clickEffectFrames.current[existingActiveEffect.id]);
                delete clickEffectFrames.current[existingActiveEffect.id];
                delete clickEffectStartTimes.current[existingActiveEffect.id];
              }
              
              // Capture current interpolated values
              const currentValues = getCurrentObjectValues(existingActiveEffect.object);
              setObjectStates(prev => ({
                ...prev,
                [existingActiveEffect.object]: currentValues
              }));
              
              // Remove from active effects
              setActiveClickEffects(prev => 
                prev.filter(e => e.id !== existingActiveEffect.id)
              );
            }
            
            // Add new effect
            setActiveClickEffects(prev => [...prev, { ...effect, id: effectId }]);
          }
        });
        element = element.parentElement;
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [clickEffects, activeClickEffects]);

  // Animate active click effects
  useEffect(() => {
    if (activeClickEffects.length === 0) return;

    activeClickEffects.forEach(effect => {
      if (clickEffectFrames.current[effect.id]) return; // Already animating

      const effectDelay = effect.delay || 0;
      const effectDuration = effect.duration || 1000;

      const animate = (currentTime) => {
        if (!clickEffectStartTimes.current[effect.id]) {
          clickEffectStartTimes.current[effect.id] = currentTime;
        }

        const elapsed = currentTime - clickEffectStartTimes.current[effect.id];
        const progress = Math.min(elapsed / effectDuration, 1);

        setClickEffectProgress(prev => ({ ...prev, [effect.id]: progress }));

        if (progress < 1) {
          clickEffectFrames.current[effect.id] = requestAnimationFrame(animate);
        } else {
          // Animation complete - commit final values
          setObjectStates(prevStates => {
            const updated = { ...prevStates };
            const objState = updated[effect.object] || {};
            
            if (effect.position) objState.position = effect.position;
            if (effect.rotation) objState.rotation = effect.rotation;
            if (effect.fov !== undefined) objState.fov = effect.fov;
            
            updated[effect.object] = objState;
            return updated;
          });

          // Cleanup
          delete clickEffectFrames.current[effect.id];
          delete clickEffectStartTimes.current[effect.id];
          
          setActiveClickEffects(prev => prev.filter(e => e.id !== effect.id));
        }
      };

      const timeoutId = setTimeout(() => {
        clickEffectFrames.current[effect.id] = requestAnimationFrame(animate);
      }, effectDelay);

      clickEffectFrames.current[`${effect.id}_timeout`] = timeoutId;
    });

    return () => {
      Object.entries(clickEffectFrames.current).forEach(([key, value]) => {
        if (key.includes('_timeout')) {
          clearTimeout(value);
        } else {
          cancelAnimationFrame(value);
        }
      });
    };
  }, [activeClickEffects]);

  // Helper: Interpolate between two values
  const interpolateValue = (start, end, progress, easing) => {
    const easedProgress = easing ? easing(progress) : progress;
    return start + (end - start) * easedProgress;
  };

  // Helper: Interpolate objects with x, y, z properties
  const interpolateVector = (start, end, progress, easing) => {
    if (!start || !end) return start || { x: 0, y: 0, z: 0 };
    return {
      x: interpolateValue(start.x, end.x, progress, easing),
      y: interpolateValue(start.y, end.y, progress, easing),
      z: interpolateValue(start.z, end.z, progress, easing)
    };
  };

  // Get current values for an object (considering active animations)
  const getCurrentObjectValues = (objectName) => {
    const baseState = objectStates[objectName] || {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    };

    let currentValues = { ...baseState };

    // Check for active load effect
    const activeLoad = activeLoadEffects.find(e => e.object === objectName);
    if (activeLoad) {
      const progress = loadEffectProgress[activeLoad.id] || 0;
      const easing = easingFunctions[activeLoad.easingFunction] || easingFunctions.linear;

      if (activeLoad.position) {
        currentValues.position = interpolateVector(
          baseState.position,
          activeLoad.position,
          progress,
          easing
        );
      }

      if (activeLoad.rotation) {
        currentValues.rotation = interpolateVector(
          baseState.rotation,
          activeLoad.rotation,
          progress,
          easing
        );
      }

      if (activeLoad.fov !== undefined && baseState.fov !== undefined) {
        currentValues.fov = interpolateValue(
          baseState.fov,
          activeLoad.fov,
          progress,
          easing
        );
      }
    }

    // Check for active click effect (overrides load effect)
    const activeClick = activeClickEffects.find(e => e.object === objectName);
    if (activeClick) {
      const progress = clickEffectProgress[activeClick.id] || 0;
      const easing = easingFunctions[activeClick.easingFunction] || easingFunctions.linear;

      if (activeClick.position) {
        currentValues.position = interpolateVector(
          baseState.position,
          activeClick.position,
          progress,
          easing
        );
      }

      if (activeClick.rotation) {
        currentValues.rotation = interpolateVector(
          baseState.rotation,
          activeClick.rotation,
          progress,
          easing
        );
      }

      if (activeClick.fov !== undefined && baseState.fov !== undefined) {
        currentValues.fov = interpolateValue(
          baseState.fov,
          activeClick.fov,
          progress,
          easing
        );
      }
    }

    return currentValues;
  };

  // Update camera every frame
  useEffect(() => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    const cameraValues = getCurrentObjectValues('camera');

    if (cameraValues.position) {
      camera.position.set(
        cameraValues.position.x,
        cameraValues.position.y,
        cameraValues.position.z
      );
    }

    if (cameraValues.rotation) {
      camera.rotation.set(
        cameraValues.rotation.x,
        cameraValues.rotation.y,
        cameraValues.rotation.z
      );
    }

    if (cameraValues.fov !== undefined) {
      camera.fov = cameraValues.fov;
      camera.updateProjectionMatrix();
    }
  });

  const cameraValues = getCurrentObjectValues('camera');

  return (
    <PerspectiveCamera 
      ref={cameraRef}
      makeDefault 
      position={[
        cameraValues.position?.x || 0,
        cameraValues.position?.y || 0,
        cameraValues.position?.z || 0
      ]}
      rotation={[
        cameraValues.rotation?.x || 0,
        cameraValues.rotation?.y || 0,
        cameraValues.rotation?.z || 0
      ]}
      fov={cameraValues.fov || 50}
    />
  );
}

export default function ThreeCanvas({
  className,
  style,
  // New props
  initialPositions = [],
  loadEffects = [],
  clickEffects = [],
  // Environment settings
  environmentUrl = "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr",
  ambientLightIntensity = 6,
  fogColor = "#0029ff",
  fogNear = 1,
  fogFar = 10,
  children
}) {
  const containerRef = useRef(null);

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
    >
      <Canvas 
        shadows 
        style={{backgroundColor: "transparent", height: "100%", width: "100%", zIndex: 2}} 
        gl={{ preserveDrawingBuffer: true}} 
        eventPrefix="client"
        resize={{ scroll: false, debounce: 0 }}
      >
        <ambientLight intensity={ambientLightIntensity}/>
        {fogColor && <fog attach="fog" color={fogColor} near={fogNear} far={fogFar} />}
        
        <CameraController 
          initialPositions={initialPositions}
          loadEffects={loadEffects}
          clickEffects={clickEffects}
        />
        
        {environmentUrl && <Environment files={environmentUrl} />}
        
        {children || <LanderScene />}
        
        <mesh 
          position={[0, 1, 0]} 
          rotation={[0, 0, 0]}       
          castShadow
          receiveShadow
        >
          <boxGeometry args={[2, 1, 10]} />
          <meshBasicMaterial color={"#201855"} side={THREE.BackSide}/>
        </mesh>
      </Canvas>
    </div>
  );
}