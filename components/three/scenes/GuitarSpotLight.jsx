'use client'
// Custom hook to get window scroll position
import { useDepthBuffer } from '@react-three/drei'
import Backdrop from '../objects/Backdrop'
import Guitar from '../objects/Guitar'
import { MovingSpot } from '../objects/MovingSpot'

export default function GuitarSpotLight({ position = [0, 0, 0], fov = 25 }){
    const depthBuffer = useDepthBuffer({ frames: Infinity })

    return(
        <>
            <MovingSpot depthBuffer={depthBuffer} color="#ffffff" position={[.50, 1.5, .2]} lookAt={[0, .25, 0]}  attenuation={.5} anglePower={10} intensity={25} distance={10}/>
            <MovingSpot depthBuffer={depthBuffer} color="#ffffff" position={[0, 1, 1]} lookAt={[0, .25, 0]} attenuation={1.5} angle={.35} anglePower={30} intensity={10} move={false}/>
            <MovingSpot depthBuffer={depthBuffer} color="#ffffff" position={[0, 0, 1]} lookAt={[0, .25, 0]} attenuation={1.5} angle={.35} anglePower={30} intensity={10} move={false}/>
            {/* <MovingSpot depthBuffer={depthBuffer} color="#ff0000" position={[-.50, 1.5, 0]} lookAt={[0, .25, 0]} attenuation={1} anglePower={10} intensity={25} distance={10} inverse={true} /> */}
            <Guitar position={[.24, 0, 0]} rotation={[0, Math.PI / .488, 0]}/>
            <Backdrop position={[0, -.004, -.1]} rotation={[Math.PI / 2, 0, 0]}/>
        </>
    )
}


