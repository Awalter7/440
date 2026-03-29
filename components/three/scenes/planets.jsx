"use client"
import React, { useRef, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ComposerProvider } from "../contexts/composerContext";

import { OrbitControls } from '@react-three/drei';
import { usePlasmicCanvasContext } from '@plasmicapp/loader-nextjs';

import Earth from '../objects/earth';
import EarthRotation from '../machanics/earthRotation';
import SpaceStation from '../objects/spaceStation';
import LensFlarePass from "../postprocessing/lensFlarePass"
import CloudSphere from "../objects/cloudSphere"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber";
import { useControls, folder } from 'leva'


const EarthWrapper = () => {
    const { camera, scene } = useThree();

    return(
        camera 
        &&
        <EarthRotation>
            <Earth
                position={[2, 0, 0]}
                args={[20, 300, 300]}
                rotation={[0, 0, Math.PI / 2]}
                camera={camera}
                scene={scene}
            />
        </EarthRotation>
    )
}


const SunWrapper = ({sunPosition = [0, 50, 1000]}) => {

    return(
        <>
            <LensFlarePass position={{x: 0, y: 50, z: 1000}}/>
            <directionalLight
                position={sunPosition}
                castShadow
                intensity={4.0}
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-far={50}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
                name={"atmosphere-source"}
            />

        </>
        
    )
}

const useMousePosition = () => {
  const ref = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => {
      ref.current.x = (e.clientX / window.innerWidth) * 2 - 1;   // -1 → 1
      ref.current.y = -(e.clientY / window.innerHeight) * 2 + 1;  // -1 → 1 (flipped)
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return ref;
};

function Intro() {
  const [vec] = useState(() => new THREE.Vector3())
  const { camera } = useThree()
  const mouse = useMousePosition()

  useFrame(() => {
    const { x, y } = mouse.current
    camera.position.lerp(vec.set(x* 20, 50 + y * 30, -100), 0.05)
    camera.lookAt(2, 21, 0)
  }, 1)
}

export function Planets({ className, id }) {
    const canvasRef = useRef(null);   // ← new ref
    const inEditor = usePlasmicCanvasContext();
    const cameraControls = useControls({
        Camera: folder(
            {
                // Planet Position
                orbitControlsEnabled: { value: false, step: 1, label: "Orbit Controlls" },
            },
            { collapsed: true }
        ),
    })

    


  // useMomentumScroll();
    return (
        <Canvas
            ref={canvasRef} 
            shadows
            camera={{
                fov: 10,
                position: [2, 200, 200], // ← starts at -550
                rotation: [-3.0332631463700075, 0, -Math.PI],
                near: 10,
                far: 10000,
            }}
            gl={{ antialias: true }}
            className={className}
            id={id}
            frameloop="always"
            style={{
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: "10",
                backgroundColor: "transparent",

        }}
        >
            {
                !inEditor
                &&
                <>
                    <ComposerProvider>
                        <EarthWrapper />
                        <SunWrapper />
                        <SpaceStation/>

                        {/* <CloudSphere /> */}
                    </ComposerProvider>
                    <mesh >
                        <boxGeometry args={[2, 2, 2]}/>
                        <meshBasicMaterial color={"red"}/>
                    </mesh>

                    {/* <CameraWrapper/> */}
                    {/* <StarsWrapper /> */}
                </>
            }

            {
                cameraControls.orbitControlsEnabled
                ?
                <OrbitControls />
                :
                <Intro />
            }
            
            {/* <OrbitControls /> */}

        </Canvas>
    );
}

export default Planets;