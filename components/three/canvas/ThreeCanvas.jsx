// ThreeCanvas.jsx
"use client"
import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, PerspectiveCamera, useProgress } from "@react-three/drei";
import OrbitalRig from "../rigs/OrbitalRig";
import LanderScene from "../scenes/LanderScene";
import * as THREE from 'three';

import PlasmicEffect from "../effects/PlasmicEffect";

export default function ThreeCanvas({
  className,
  style,
  initialPositions = [],
  loadEffect = [],
  clickEffects = [],
}) {
  const containerRef = useRef(null);

  // Get initial camera values for Canvas setup
  const initialCamera = React.useMemo(() => {
    const initial = initialPositions.find(item => item.object === "camera");
    return {
      position: initial?.position ? [initial.position.x, initial.position.y, initial.position.z] : [0, 1, 1],
      fov: initial?.fov || 25
    };
  }, [initialPositions]);

  
  const CameraInitialPositions = initialPositions.filter((effect) => effect.object === "camera");
  const CameraLoadEffect = loadEffect.filter((effect) => effect.object === "camera");
  const CameraClickEffects = clickEffects.filter((effect) => effect.object === "camera");

  console.log(CameraInitialPositions, CameraLoadEffect, CameraClickEffects)
  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
    >
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 0], fov: 25}}
        style={{backgroundColor: "transparent", height: "100%", width: "100%", zIndex: 2}} 
        gl={{ preserveDrawingBuffer: true}} 
        eventPrefix="client"
        resize={{ scroll: false, debounce: 0 }}
      >
        <ambientLight intensity={6}/>
        <fog attach="fog" color="#0029ff" near={1} far={5} />
        
        <PlasmicEffect 
          objectId="camera"
          initialPositions={CameraInitialPositions}
          loadEffect={CameraLoadEffect}
          clickEffects={CameraClickEffects}
          camera={true}
        >
          <PerspectiveCamera makeDefault />
        </PlasmicEffect>

        <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr" />
        <LanderScene />
        <mesh 
          position={[0, 1, 0]} 
          rotation={[0, 0, 0]}       
          castShadow
          receiveShadow
        >
          <boxGeometry args={[2, 1, 20]} />
          <meshBasicMaterial color={"#201855"} side={THREE.BackSide}/>
        </mesh>
      </Canvas>
    </div>
  );
}