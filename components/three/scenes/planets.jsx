"use client"
import { Canvas } from "@react-three/fiber";
import PlanetGroup from "../objects/planets"
import {ComposerProvider} from "../contexts/composerContext";
import {OrbitControls } from '@react-three/drei'

export function Planets({
    className,
    id,
}){
    return(
        <Canvas
            shadows
            camera={{ 
                fov: 20, 
                rotateY: Math.PI / 2, 
                position: [
                    -5,
                    18,
                    -150.29371456850212
                ], 
                rotation: [
                    -3.0332631463700075,
                    -0.13525562757141046,
                    -Math.PI / 2
                ], 
                near: 10, 
                far: 10000,  
            }}
            gl={{
                antialias: true,
            }}
            className={className}
            id={id}
            style={{
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: "10",
                backgroundColor: "transparent",
            }}

        >
            <ComposerProvider>
                <PlanetGroup/>
            </ComposerProvider>
            {/* <OrbitControls /> */}
        </Canvas>
    )
}


export default Planets;