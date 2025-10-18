// ThreeCanvas.jsx
"use client"
import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import OrbitalRig from "../rigs/OrbitalRig";
import LanderScene from "../scenes/LanderScene";
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import PlasmicEffect from "../effects/PlasmicEffect";





function MorphingParticles(stencilEnabled) {
  const meshRef = useRef();
  const [fontLoaded, setFontLoaded] = useState(false);
  const [textGeometry, setTextGeometry] = useState(null);

  const position = [0, 1, 1];

  useEffect(() => {
    const loader = new FontLoader();
    
    loader.load(
      'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
      (loadedFont) => {
        let geometry = new TextGeometry('WHERE?', {
          font: loadedFont,
          size: .3,
          height: 0,
          curveSegments: 120,
          bevelEnabled: true,
          bevelThickness: 0.01,
          bevelEnabled: false,
          bevelOffset: 0,
          bevelSegments: 8,
          depth: .0001,
        });
        
        
        geometry.computeBoundingBox();
        console.log(geometry)
        const centerOffset = new THREE.Vector3();
        geometry.boundingBox.getCenter(centerOffset);
        geometry.translate(-centerOffset.x, -centerOffset.y, -centerOffset.z);


        setTextGeometry(geometry);
        setFontLoaded(true);
      },
      undefined,
      (error) => {
        console.error('Error loading font:', error);
      }
    );
  }, []);


  
  return (
    <>
      {/* Stencil mask - write to stencil buffer first */}
      {fontLoaded && textGeometry && (
        <>
          {stencilEnabled && (
            <mesh 
              geometry={textGeometry}
              position={position}
              renderOrder={-1}
            >
                <meshBasicMaterial 
                  color="#ffffff"
                  colorWrite={false}
                  stencilWrite={true}
                  stencilRef={1}
                  stencilFunc={THREE.AlwaysStencilFunc}
                  stencilZPass={THREE.ReplaceStencilOp}
                  stencilFail={THREE.KeepStencilOp}
                  stencilZFail={THREE.KeepStencilOp}
                />
            </mesh>
          )}
          {/* Visible text */}
          {/* {!stencilEnabled && ( */}


          {/* )} */}

        </>
      )}
    
    </>
  );
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

  // Add keyboard listener for Ctrl+O
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        setStencilEnabled(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


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
        
        {/* <MorphingParticles stencilEnabled={stencilEnabled} /> */}
        <LanderScene stencilEnabled={stencilEnabled}/>
        {/* <OrbitControls enablePan enableZoom /> */}
        <mesh 
          position={[0, 1, 0]} 
          rotation={[0, 0, 0]}       
          castShadow
          receiveShadow
          renderOrder={1}
        >
          <boxGeometry args={[2, 1, 20]} />
          <meshStandardMaterial 
            color={"#201855"} 
            side={THREE.DoubleSide}
          />
        </mesh>
      </Canvas>
    </div>
  );
}