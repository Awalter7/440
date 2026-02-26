"use client"
import { Canvas } from "@react-three/fiber";
import PlanetGroup from "../objects/planets"
import {ComposerProvider} from "../contexts/composerContext";
import {OrbitControls } from '@react-three/drei'

export function Planets(){
    return(
        <Canvas
            shadows
            camera={{ 
                fov: 20, 
                rotateY: Math.PI / 2, 
                position: [
                    -3.630548076987942,
                    24.053561841279016,
                    -28.29371456850212
                ], 
                rotation: [
                    -3.0332631463700075,
                    -0.13525562757141046,
                    -3.126928752385097
                ], 
                near: 10, 
                far: 10000,  
            }}
            gl={{
                antialias: true,
            }}
            className="max-w-screen max-h-screen absolute top-[0px] z-0"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: "10",
                backgroundColor: "#000000",
              }}
        >
            <ComposerProvider>
                <PlanetGroup/>
            </ComposerProvider>
            <OrbitControls />
        </Canvas>
    )
}


export default Planets;