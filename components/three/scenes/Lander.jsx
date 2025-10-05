"use client"
import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import OrbitalRig from "../rigs/OrbitalRig";
import Backdrop from "../objects/Backdrop";
import Guitar from "../objects/Guitar";

export function LanderScene({
  position = [0, 0, 2],
  fov = 25,
  className,
  style,
}) {
  const containerRef = useRef(null);
  console.log("here")
  
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
      <Canvas
        shadows
        camera={{ position, fov }}
        style={{
          backgroundColor: "transparent",
          width: "100%",
          height: "100%",
        }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <fog attach="fog" color="black" near={1} far={3.5} />
        <OrbitalRig>
          <Guitar position={[0, -0.3, 0]} />
          <Backdrop position={[0, -0.295, 0]} />
          <Environment
            files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr"
          />
        </OrbitalRig>
      </Canvas>
    </div>
  );
}

export default LanderScene;