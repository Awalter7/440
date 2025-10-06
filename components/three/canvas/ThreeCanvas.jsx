// Lander.jsx
"use client"
import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import OrbitalRig from "../rigs/OrbitalRig";
import GuitarScene from "../scenes/GuitarScene";

export default function ThreeCanvas({
  className,
  style,
  cameraPosition = [0, 1, 1],
  cameraFov = 25,
  animationMode = "interpolation",
  duration = 1000,
  startX = 0.2,
  startY = -0.2,
  startZ = -1,
  endX = 0.2,
  endY = -0.2,
  endZ = -1,
  startRotationX = Math.PI / 2,
  startRotationY = Math.PI,
  startRotationZ = Math.PI / 2,
  endRotationX = Math.PI / 2,
  endRotationY = Math.PI,
  endRotationZ = Math.PI / 2,
  scrollStart = 0,
  scrollEnd = 1000,
}) {
  const [isClient, setIsClient] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [animatedPosition, setAnimatedPosition] = useState([startX, startY, startZ]);
  const [animatedRotation, setAnimatedRotation] = useState([startRotationX, startRotationY, startRotationZ]);
  const containerRef = useRef(null);
  const animationStartTime = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    setIsClient(true);

    if (!containerRef.current) return;

    containerRef.current.addEventListener('wheel', (event) => {
      event.preventDefault();
    });
  }, []);

  // Scroll handling
  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      if (animationMode === "interpolation") {
        if (scrollY <= scrollStart) {
          setScrollProgress(0);
        } else if (scrollY >= scrollEnd) {
          setScrollProgress(1);
        } else {
          const progress = (scrollY - scrollStart) / (scrollEnd - scrollStart);
          setScrollProgress(progress);
        }
      } else {
        if (scrollY >= scrollStart && !isAnimating && animationProgress < 1) {
          setIsAnimating(true);
          animationStartTime.current = performance.now();
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isClient, scrollStart, scrollEnd, animationMode, isAnimating, animationProgress]);

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
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isAnimating, duration, animationMode]);

  // Update animated position and rotation
  useEffect(() => {
    const progress = animationMode === "duration" ? animationProgress : scrollProgress;
    
    const x = startX + (endX - startX) * progress;
    const y = startY + (endY - startY) * progress;
    const z = startZ + (endZ - startZ) * progress;
    
    const rotX = startRotationX + (endRotationX - startRotationX) * progress;
    const rotY = startRotationY + (endRotationY - startRotationY) * progress;
    const rotZ = startRotationZ + (endRotationZ - startRotationZ) * progress;
    
    setAnimatedPosition([x, y, z]);
    setAnimatedRotation([rotX, rotY, rotZ]);
  }, [scrollProgress, animationProgress, animationMode, startX, startY, startZ, endX, endY, endZ, startRotationX, startRotationY, startRotationZ, endRotationX, endRotationY, endRotationZ]);
  
  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
    >
      <Canvas 
        shadows 
        camera={{ position: cameraPosition, fov: cameraFov }}
        style={{backgroundColor: "transparent", height: "100vh", width: "100vw", zIndex: 2}} 
        gl={{ preserveDrawingBuffer: true}} 
        eventSource={document.getElementById('root')} 
        eventPrefix="client"
      >
        <Environment environmentIntensity={.5} files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr" />
        <OrbitalRig>
          <GuitarScene animatedPosition={animatedPosition} animatedRotation={animatedRotation} />
        </OrbitalRig>
      </Canvas>
    </div>
  );
}