// ThreeCanvas.jsx
"use client"
import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import OrbitalRig from "../rigs/OrbitalRig";
import LanderScene from "../scenes/LanderScene";
import * as THREE from 'three';
import easingFunctions from "../../utils/easingFunctions";

export default function ThreeCanvas({
  className,
  style,
  // Legacy props for backwards compatibility
  cameraPosition = [0, 1, 1],
  cameraFov = 25,
  cameraRotation = [0, 0, 0],
  animationMode = "interpolation",
  duration = 1000,
  easingFunction = "linear",
  scrollStart = 0,
  scrollEnd = 1000,
  // New multi-breakpoint prop
  breakpoints = [],
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [currentBreakpointIndex, setCurrentBreakpointIndex] = useState(0);
  const containerRef = useRef(null);
  const animationStartTime = useRef(null);
  const animationFrameId = useRef(null);

  // Build breakpoints array from legacy props or use new breakpoints prop
  const effectiveBreakpoints = React.useMemo(() => {
    if (breakpoints && breakpoints.length > 0) {
      return breakpoints;
    }
    
    // Legacy mode: create single breakpoint from individual props
    return [{
      scrollStart,
      scrollEnd,
      easingFunction: easingFunction,
      cameraPosition: cameraPosition,
      cameraRotation: cameraRotation,
      cameraFov: cameraFov,
    }];
  }, [
    breakpoints,
    scrollStart, 
    scrollEnd, 
    easingFunction,
    cameraPosition,
    cameraRotation,
    cameraFov
  ]);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      if (animationMode === "interpolation") {
        // Find which breakpoint we're in
        let found = false;
        for (let i = 0; i < effectiveBreakpoints.length; i++) {
          const bp = effectiveBreakpoints[i];
          const bpStart = bp.scrollStart || 0;
          const bpEnd = bp.scrollEnd || 1000;
          
          if (scrollY >= bpStart && scrollY <= bpEnd) {
            const progress = (scrollY - bpStart) / (bpEnd - bpStart);
            setScrollProgress(progress);
            setCurrentBreakpointIndex(i);
            found = true;
            break;
          }
        }
        
        // Handle edge cases
        if (!found) {
          if (scrollY < (effectiveBreakpoints[0]?.scrollStart || 0)) {
            setScrollProgress(0);
            setCurrentBreakpointIndex(0);
          } else {
            setScrollProgress(1);
            setCurrentBreakpointIndex(effectiveBreakpoints.length - 1);
          }
        }
      } else {
        // Duration mode: check all breakpoints for trigger
        for (let i = 0; i < effectiveBreakpoints.length; i++) {
          const bp = effectiveBreakpoints[i];
          const bpStart = bp.scrollStart || 0;
          
          if (scrollY >= bpStart && i > currentBreakpointIndex) {
            setCurrentBreakpointIndex(i);
            setIsAnimating(true);
            setAnimationProgress(0);
            animationStartTime.current = null;
            break;
          }
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [effectiveBreakpoints, animationMode, currentBreakpointIndex]);

  // Duration-based animation loop
  useEffect(() => {
    if (!isAnimating || animationMode !== "duration") return;

    const animate = (currentTime) => {
      if (!animationStartTime.current) {
        animationStartTime.current = currentTime;
      }

      const elapsed = currentTime - animationStartTime.current;
      const progress = Math.min(elapsed / duration, 1);

      setAnimationProgress(progress);

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setAnimationProgress(1);
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isAnimating, duration, animationMode]);

  // Interpolate between two values
  const interpolateValue = (start, end, progress, easing) => {
    const easedProgress = easing ? easing(progress) : progress;
    return start + (end - start) * easedProgress;
  };

  // Interpolate arrays (for position/rotation)
  const interpolateArray = (startArray, endArray, progress, easing) => {
    if (!startArray || !endArray) return startArray || [0, 0, 0];
    return startArray.map((start, i) => 
      interpolateValue(start, endArray[i] || 0, progress, easing)
    );
  };

  // Get current camera values based on active breakpoint
  const getCurrentCameraValues = () => {
    const currentBp = effectiveBreakpoints[currentBreakpointIndex];
    const nextBpIndex = currentBreakpointIndex + 1;
    
    if (!currentBp) {
      return {
        position: cameraPosition,
        rotation: cameraRotation,
        fov: cameraFov,
      };
    }

    const progress = animationMode === "duration" ? animationProgress : scrollProgress;
    
    // Get easing function for this breakpoint
    const easingName = currentBp.easingFunction || easingFunction || "linear";
    const easing = easingFunctions[easingName] || easingFunctions.linear;

    // For interpolation mode, interpolate within current breakpoint
    if (animationMode === "interpolation") {
      const startPos = currentBp.cameraPosition || cameraPosition;
      const endPos = currentBp.endCameraPosition || startPos;
      
      const startRot = currentBp.cameraRotation || cameraRotation;
      const endRot = currentBp.endCameraRotation || startRot;
      
      const startFov = currentBp.cameraFov !== undefined ? currentBp.cameraFov : cameraFov;
      const endFov = currentBp.endCameraFov !== undefined ? currentBp.endCameraFov : startFov;

      return {
        position: interpolateArray(startPos, endPos, progress, easing),
        rotation: interpolateArray(startRot, endRot, progress, easing),
        fov: interpolateValue(startFov, endFov, progress, easing),
      };
    }

    // For duration mode, interpolate to next breakpoint
    if (nextBpIndex < effectiveBreakpoints.length) {
      const nextBp = effectiveBreakpoints[nextBpIndex];
      
      const startPos = currentBp.cameraPosition || cameraPosition;
      const endPos = nextBp.cameraPosition || startPos;
      
      const startRot = currentBp.cameraRotation || cameraRotation;
      const endRot = nextBp.cameraRotation || startRot;
      
      const startFov = currentBp.cameraFov !== undefined ? currentBp.cameraFov : cameraFov;
      const endFov = nextBp.cameraFov !== undefined ? nextBp.cameraFov : startFov;

      return {
        position: interpolateArray(startPos, endPos, progress, easing),
        rotation: interpolateArray(startRot, endRot, progress, easing),
        fov: interpolateValue(startFov, endFov, progress, easing),
      };
    }

    // Last breakpoint, stay at final values
    return {
      position: currentBp.cameraPosition || cameraPosition,
      rotation: currentBp.cameraRotation || cameraRotation,
      fov: currentBp.cameraFov !== undefined ? currentBp.cameraFov : cameraFov,
    };
  };

  const currentCameraValues = getCurrentCameraValues();

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
    >
      <Canvas 
        shadows 
        camera={{ position: currentCameraValues.position, fov: currentCameraValues.fov }}
        style={{backgroundColor: "transparent", height: "100%", width: "100%", zIndex: 2}} 
        gl={{ preserveDrawingBuffer: true}} 
        eventPrefix="client"
        resize={{ scroll: false, debounce: 0 }}
      >
        <ambientLight intensity={6}/>
        <fog attach="fog" color="#0029ff" near={1} far={10} />
        <PerspectiveCamera 
          makeDefault 
          position={currentCameraValues.position} 
          fov={currentCameraValues.fov} 
          rotation={currentCameraValues.rotation}
        />
        <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr" />
        <LanderScene 
          scrollProgress={scrollProgress}
        />
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