// ThreeCanvas.jsx
"use client"
import React, { useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, PerspectiveCamera, useProgress } from "@react-three/drei";
import LanderScene from "../scenes/LanderScene";
import * as THREE from 'three';

import PlasmicEffect from "../effects/PlasmicEffect";

// New component to handle pre-rendering
function ScenePreloader({ onPreloadComplete }) {
  const { gl, scene, camera } = useThree();
  const { progress } = useProgress();
  const [isCompiling, setIsCompiling] = useState(false);
  const hasCompiled = useRef(false);

  useEffect(() => {
    // Wait for all assets to load (progress === 100)
    if (progress === 100 && !hasCompiled.current && !isCompiling) {
      hasCompiled.current = true;
      setIsCompiling(true);

      // Use setTimeout to ensure scene is fully set up
      setTimeout(() => {
        console.log('Pre-compiling shaders...');
        
        // Compile all shaders in the scene
        gl.compile(scene, camera);
        
        console.log('Shader compilation complete');
        setIsCompiling(false);
        
        if (onPreloadComplete) {
          onPreloadComplete();
        }
      }, 100);
    }
  }, [progress, gl, scene, camera, isCompiling, onPreloadComplete]);

  return null;
}

export default function ThreeCanvas({
  className,
  style,
  initialPositions = [],
  loadEffect = [],
  clickEffects = [],
}) {
  const containerRef = useRef(null);
  const [stencilEnabled, setStencilEnabled] = useState(true);
  
  const CameraInitialPositions = initialPositions.filter((effect) => effect.object === "camera");
  const CameraLoadEffect = loadEffect.filter((effect) => effect.object === "camera");
  const CameraClickEffects = clickEffects.filter((effect) => effect.object === "camera");


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
        gl={{ preserveDrawingBuffer: true, stencil: true, antialias: true }} 
        eventPrefix="client"
        resize={{ scroll: false, debounce: 0 }}
      >
        <ScenePreloader />
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
        

        <LanderScene stencilEnabled={stencilEnabled}/>
        {/* <OrbitControls enablePan enableZoom /> */}
        <mesh 
          position={[0, 1, 0]} 
          rotation={[0, 0, 0]}       
          castShadow
          receiveShadow
          renderOrder={1}
        >
          <boxGeometry args={[2, 1, 100]} />
          <meshStandardMaterial 
            color={"#201855"} 
            side={THREE.DoubleSide}
          />
        </mesh>
      </Canvas>
    </div>
  );
}