// Lander.jsx
"use client"
import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import OrbitalRig from "../rigs/OrbitalRig";
import LanderScene from "../scenes/LanderScene";
import * as THREE from 'three'
import easingFunctions from "@/components/utils/easingFunctions";


export default function ThreeCanvas({
  className,
  style,
  // Legacy single breakpoint props
  cameraPosition = [0, 1, 1],
  cameraRotation = [0, 0, 0],
  cameraFov = 25,
  animationMode = "interpolation",
  easingFunction = "linear",
  duration = 1000,
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
      cameraPosition,
      cameraRotation,
      cameraFov,
    }];
  }, [
    breakpoints,
    scrollStart, scrollEnd, easingFunction,
    cameraPosition, cameraRotation, cameraFov
  ]);

  // Scroll handling
  useEffect(() => {
    if (!isClient) return;

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
  }, [isClient, effectiveBreakpoints, animationMode, currentBreakpointIndex]);

  // Duration-based animation loop
  useEffect(() => {
    if (!isAnimating || animationMode !== "duration") return;

    const currentBp = effectiveBreakpoints[currentBreakpointIndex];
    const animDuration = currentBp?.duration || duration;

    const animate = (currentTime) => {
      if (!animationStartTime.current) {
        animationStartTime.current = currentTime;
      }

      const elapsed = currentTime - animationStartTime.current;
      const progress = Math.min(elapsed / animDuration, 1);

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
  }, [isAnimating, duration, animationMode, effectiveBreakpoints, currentBreakpointIndex]);

  // Interpolate between two arrays (for position/rotation)
  const interpolateArray = (start, end, progress, easing) => {
    if (!start || !end) return start || [0, 0, 0];
    
    const easedProgress = easing ? easing(progress) : progress;
    
    return start.map((startVal, i) => {
      const endVal = end[i] || 0;
      return startVal + (endVal - startVal) * easedProgress;
    });
  };

  // Interpolate single number (for FOV)
  const interpolateNumber = (start, end, progress, easing) => {
    if (start === undefined || end === undefined) return start;
    
    const easedProgress = easing ? easing(progress) : progress;
    return start + (end - start) * easedProgress;
  };

  // Get current camera state based on active breakpoint
  const getCurrentCameraState = () => {
    const currentBp = effectiveBreakpoints[currentBreakpointIndex];
    
    // If we only have one breakpoint or we're at the last one, just return its values
    if (effectiveBreakpoints.length === 1 || currentBreakpointIndex === effectiveBreakpoints.length - 1) {
      return {
        position: currentBp?.cameraPosition || [0, 1, 1],
        rotation: currentBp?.cameraRotation || [0, 0, 0],
        fov: currentBp?.cameraFov || 25,
      };
    }

    // Get next breakpoint for interpolation
    const nextBp = effectiveBreakpoints[currentBreakpointIndex + 1];
    
    const progress = animationMode === "duration" ? animationProgress : scrollProgress;
    
    // Get easing function for this breakpoint
    const easingName = currentBp?.easingFunction || easingFunction || "linear";
    const easing = easingFunctions[easingName] || easingFunctions.linear;
    
    return {
      position: interpolateArray(
        currentBp?.cameraPosition || [0, 1, 1],
        nextBp?.cameraPosition || currentBp?.cameraPosition || [0, 1, 1],
        progress,
        easing
      ),
      rotation: interpolateArray(
        currentBp?.cameraRotation || [0, 0, 0],
        nextBp?.cameraRotation || currentBp?.cameraRotation || [0, 0, 0],
        progress,
        easing
      ),
      fov: interpolateNumber(
        currentBp?.cameraFov || 25,
        nextBp?.cameraFov || currentBp?.cameraFov || 25,
        progress,
        easing
      ),
    };
  };

  const cameraState = getCurrentCameraState();

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
        <ambientLight intensity={6}/>
        <fog attach="fog" color="#0029ff" near={1} far={3} />
        
        <PerspectiveCamera 
          makeDefault 
          position={cameraState.position} 
          fov={cameraState.fov} 
          rotation={cameraState.rotation}
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
          <meshBasicMaterial color={"#362986"} side={THREE.BackSide}/>
        </mesh>
      </Canvas>
    </div>
  );
}