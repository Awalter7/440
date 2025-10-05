'use client'
import { Vector3 } from 'three'
import { useEffect, useRef } from 'react'
import {useFrame, useThree} from '@react-three/fiber'
import {SpotLight} from '@react-three/drei'

export function MovingSpot({ vec = new Vector3(), move = true, inverse = false, lookAt = [0, 1, 0], ...props }) {
  const light = useRef()
  const viewport = useThree((state) => state.viewport)

  useFrame((state, delta) => {
    if(move === true){
      let mouseX = state.mouse.x
      const vpWidth = viewport.width;
      const vpHeight = viewport.height;

      // console.log(mouseX)
      // console.log(mouseX > -.50 && mouseX < .50)
      // if(mouseX > -.25 && mouseX < .25){
        light.current.target.position.lerp(vec.set(inverse ? -(mouseX  * vpWidth) / 2 : (mouseX * vpWidth) / 2, inverse ? -(mouseX * vpHeight) / 2 : (mouseX * vpHeight) / 2, 0), 0.1)
        light.current.target.updateMatrixWorld()
      // }
    }
  })


  useEffect(() => {
    if(!light.current) return;

    if(move !== true){
        light.current.target.position.lerp(vec.set(lookAt[0], lookAt[1], lookAt[2]), 0.1)
        light.current.target.updateMatrixWorld()
    }
  }, [light])

  return <SpotLight castShadow ref={light} penumbra={1} distance={6} angle={0.2} attenuation={1.5} anglePower={4} intensity={2} {...props} />
}
