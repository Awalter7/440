'use client'
// Custom hook to get window scroll position
import { useDepthBuffer } from '@react-three/drei'
import Backdrop from '../objects/Backdrop'
import Guitar from '../objects/Guitar'
import Floor from '../objects/Floor'
import { MovingSpot } from '../objects/MovingSpot'
import { useState, useEffect, useRef } from 'react'
import DrumStand from "../objects/DrumStand"
import DrumKick from '../objects/DrumKick'
import Piano from '../objects/Piano'
import Float from '../effects/Float'

export default function LanderScene({ 
  scrollProgress,
}) {
  const depthBuffer = useDepthBuffer({ frames: Infinity });

  return (
    <>
      <MovingSpot 
        depthBuffer={depthBuffer} 
        color="#ffffff" 
        position={[.2, 1, 2]} 
        lookAt={[-.4, 1.1, .3]} 
        attenuation={1.5} 
        angle={.35} 
        anglePower={10} 
        intensity={15} 
        mode={"on"}
        flickerDuration={500}
        realOff={true}
      />

      <Float intensity={.02} directions={{ x: true, y: true, z: false }}>
        <Guitar position={[-.72, 1.5, .3]} rotation={[.2, -Math.PI / 1.7, .6]}/>
        <DrumKick position={[-.15, .8, .3]} rotation={[-Math.PI / 1.5, Math.PI / 1.3, -Math.PI / 5]}/>
        <Piano position={[-.2, 1.85, -.4]} rotation={[Math.PI / 1.5, -Math.PI / 4, Math.PI / .85]} />
        <DrumStand position={[.55, .8, .3]} rotation={[-Math.PI / .9, 0, -Math.PI / 9]} />
      </Float>
    </>
  );
}