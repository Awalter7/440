// Lander.jsx
"use client"
import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import OrbitalRig from "../rigs/OrbitalRig";
import GuitarSpotLight from "../scenes/GuitarSpotLight";

export function LanderScene({
  position = [0, 0, 2],
  fov = 25,
  className,
  style,
}) {
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything until we're on the client
  if (!isClient) {
    return (
      <div
        className={className}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          ...style,
        }}
      >
        Loading 3D Scene...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "transparent",
        ...style,
      }}
    >
      <Canvas shadows camera={{ position, fov }}  style={{backgroundColor: "transparent", height: "100vh", width: "100vw", zIndex: 2}} gl={{ preserveDrawingBuffer: true}} eventSource={document.getElementById('root')} eventPrefix="client">
        <fog attach="fog" color="black" near={1} far={3.5} />
        <Environment environmentIntensity={.5} files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr" />
        <OrbitalRig >
          <GuitarSpotLight />
        </OrbitalRig>
      </Canvas>
    </div>
  );
}

export default LanderScene;