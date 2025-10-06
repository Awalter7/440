// Lander.jsx
"use client"
import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import OrbitalRig from "../rigs/OrbitalRig";
import GuitarScene from "../scenes/GuitarScene";
import Floor from "../objects/Floor";
import { AxesHelper } from "three";

export default function ThreeCanvas({
  className,
  style,
  cameraPosition = [0, 1, 1],
  cameraFov = 25,
  animationMode = "interpolation",
  duration = 1000,
  // Guitar props
  guitarStartX = 0.2,
  guitarStartY = -0.2,
  guitarStartZ = -1,
  guitarEndX = 0.2,
  guitarEndY = -0.2,
  guitarEndZ = -1,
  guitarStartRotationX = Math.PI / 2,
  guitarStartRotationY = Math.PI,
  guitarStartRotationZ = Math.PI / 2,
  guitarEndRotationX = Math.PI / 2,
  guitarEndRotationY = Math.PI,
  guitarEndRotationZ = Math.PI / 2,
  guitarStartOpacity = 1,
  guitarEndOpacity = 1,
  // Floor props
  floorStartX = 0,
  floorStartY = -0.2,
  floorStartZ = 0,
  floorEndX = 0,
  floorEndY = -0.2,
  floorEndZ = 0,
  floorStartRotationX = -Math.PI / 2,
  floorStartRotationY = 0,
  floorStartRotationZ = 0,
  floorEndRotationX = -Math.PI / 2,
  floorEndRotationY = 0,
  floorEndRotationZ = 0,
  floorStartOpacity = 1,
  floorEndOpacity = 1,
  scrollStart = 0,
  scrollEnd = 1000,
}) {
  const [isClient, setIsClient] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [guitarAnimatedPosition, setGuitarAnimatedPosition] = useState([guitarStartX, guitarStartY, guitarStartZ]);
  const [guitarAnimatedRotation, setGuitarAnimatedRotation] = useState([guitarStartRotationX, guitarStartRotationY, guitarStartRotationZ]);
  const [guitarAnimatedOpacity, setGuitarAnimatedOpacity] = useState(guitarStartOpacity);
  const [floorAnimatedPosition, setFloorAnimatedPosition] = useState([floorStartX, floorStartY, floorStartZ]);
  const [floorAnimatedRotation, setFloorAnimatedRotation] = useState([floorStartRotationX, floorStartRotationY, floorStartRotationZ]);
  const [floorAnimatedOpacity, setFloorAnimatedOpacity] = useState(floorStartOpacity);
  const containerRef = useRef(null);
  const animationStartTime = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    setIsClient(true);
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

  // Update animated position and rotation for Guitar
  useEffect(() => {
    const progress = animationMode === "duration" ? animationProgress : scrollProgress;
    
    const x = guitarStartX + (guitarEndX - guitarStartX) * progress;
    const y = guitarStartY + (guitarEndY - guitarStartY) * progress;
    const z = guitarStartZ + (guitarEndZ - guitarStartZ) * progress;
    
    const rotX = guitarStartRotationX + (guitarEndRotationX - guitarStartRotationX) * progress;
    const rotY = guitarStartRotationY + (guitarEndRotationY - guitarStartRotationY) * progress;
    const rotZ = guitarStartRotationZ + (guitarEndRotationZ - guitarStartRotationZ) * progress;
    
    const opacity = guitarStartOpacity + (guitarEndOpacity - guitarStartOpacity) * progress;
    
    setGuitarAnimatedPosition([x, y, z]);
    setGuitarAnimatedRotation([rotX, rotY, rotZ]);
    setGuitarAnimatedOpacity(opacity);
  }, [scrollProgress, animationProgress, animationMode, guitarStartX, guitarStartY, guitarStartZ, guitarEndX, guitarEndY, guitarEndZ, guitarStartRotationX, guitarStartRotationY, guitarStartRotationZ, guitarEndRotationX, guitarEndRotationY, guitarEndRotationZ, guitarStartOpacity, guitarEndOpacity]);

  // Update animated position and rotation for Floor
  useEffect(() => {
    const progress = animationMode === "duration" ? animationProgress : scrollProgress;
    
    const x = floorStartX + (floorEndX - floorStartX) * progress;
    const y = floorStartY + (floorEndY - floorStartY) * progress;
    const z = floorStartZ + (floorEndZ - floorStartZ) * progress;
    
    const rotX = floorStartRotationX + (floorEndRotationX - floorStartRotationX) * progress;
    const rotY = floorStartRotationY + (floorEndRotationY - floorStartRotationY) * progress;
    const rotZ = floorStartRotationZ + (floorEndRotationZ - floorStartRotationZ) * progress;
    
    const opacity = floorStartOpacity + (floorEndOpacity - floorStartOpacity) * progress;
    
    setFloorAnimatedPosition([x, y, z]);
    setFloorAnimatedRotation([rotX, rotY, rotZ]);
    setFloorAnimatedOpacity(opacity);
  }, [scrollProgress, animationProgress, animationMode, floorStartX, floorStartY, floorStartZ, floorEndX, floorEndY, floorEndZ, floorStartRotationX, floorStartRotationY, floorStartRotationZ, floorEndRotationX, floorEndRotationY, floorEndRotationZ, floorStartOpacity, floorEndOpacity]);

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
        eventPrefix="client"
      >
        <ambientLight intensity={1 - scrollProgress + .5 }/>
        <fog attach="fog" color="black" near={1} far={10} />
        <Floor 
          animatedPosition={floorAnimatedPosition} 
          animatedRotation={floorAnimatedRotation}
          animatedOpacity={floorAnimatedOpacity}
        />
        {/* <Environment intensity={0.005} files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr" /> */}
        <OrbitalRig scrollProgress={scrollProgress}>
          <GuitarScene 
            guitarAnimatedPosition={guitarAnimatedPosition} 
            guitarAnimatedRotation={guitarAnimatedRotation}
            guitarAnimatedOpacity={guitarAnimatedOpacity}
            scrollProgress={scrollProgress}
          />
        </OrbitalRig>

        {/* <OrbitControls enablePan enableZoom/> */}
      </Canvas>
    </div>
  );
}