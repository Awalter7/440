'use client'
// Custom hook to get window scroll position
import { useDepthBuffer } from '@react-three/drei'
import Backdrop from '../objects/Backdrop'
import Guitar from '../objects/Guitar'
import Floor from '../objects/Floor'
import { MovingSpot } from '../objects/MovingSpot'
import { useState, useEffect } from 'react'

export default function GuitarScene({ 
  guitarAnimatedPosition, 
  guitarAnimatedRotation,
  guitarAnimatedOpacity,
  scrollProgress,
}) {
  const depthBuffer = useDepthBuffer({ frames: Infinity });
  const [lightMode, setLightMode] = useState("off");

  useEffect(() => {
    if(scrollProgress > .95){
        setLightMode("on")
    }else{
        setLightMode("off")
    }
  }, [scrollProgress])

  useEffect(() => {
    console.log(lightMode)
  }, [lightMode])

  return (
    <>
      <MovingSpot 
        depthBuffer={depthBuffer} 
        color="#ffffff" 
        position={[0, 1, 1]} 
        lookAt={[0, -.5, -2]} 
        attenuation={1.5} 
        angle={.35} 
        anglePower={10} 
        intensity={10} 
        move={false}
        mode={lightMode}
        flickerDuration={500}
        realOff={true}
      />
      <Guitar animatedPosition={guitarAnimatedPosition} animatedRotation={guitarAnimatedRotation} animatedOpacity={guitarAnimatedOpacity}/>
      {/* <Backdrop position={[0, -.004, -.1]} rotation={[Math.PI / 2, 0, 0]}/> */}
    </>
  );
}