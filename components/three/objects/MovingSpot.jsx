import { Vector3 } from 'three'
import { useEffect, useRef } from 'react'
import {useFrame, useThree} from '@react-three/fiber'
import {SpotLight} from '@react-three/drei'
import { state } from '../store'

export function MovingSpot({ vec = new Vector3(), move = true, inverse = false, lookAt = [0, 1, 0], ...props }) {
  const light = useRef()
  const viewport = useThree((state) => state.viewport)
  useFrame((state, delta) => {
    if(move === true){
      let mouseX = state.mouse.x
      let mouseY = state.mouse.y
      const vpWidth = viewport.width;
      const vpHeight = viewport.height;

      light.current.target.position.lerp(vec.set(inverse ? -(mouseX  * vpWidth) / 2 : (mouseX * vpWidth) / 2, inverse ? -(mouseY * vpHeight) / 2 : (mouseY * vpHeight) / 2, 0), 0.1)
      light.current.target.updateMatrixWorld()
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
