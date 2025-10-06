`use client`
import { useRef} from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useSnapshot } from 'valtio'
import { state } from '../store'

export default function OrbitalRig({ children, initialPosition, scrollProgress }) {
  const group = useRef()
  const snap = useSnapshot(state)

  useFrame((state, delta) => {
    if(scrollProgress < .9){
        easing.damp3(state.camera.position, [snap.intro ? -state.viewport.width / 100 + .15: 0, .5, 2.2 ], 0.25, delta)
        easing.dampE(group.current.rotation, [-Math.PI / 5, -state.pointer.x / 5, 0], 0.25, delta)
    }else{
        easing.damp3(state.camera.position, [0, .5, 2.2 ], 0.25, delta)
        easing.dampE(group.current.rotation, [-Math.PI / 5, 0, 0], 0.25, delta)
    }
    
    state.camera.lookAt(0, .5, 0)
    
  })

  return <group ref={group}>{children}</group>
}

