`use client`
import { useRef} from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useSnapshot } from 'valtio'
import { state } from '../store'

export default function OrbitalRig({ children, initialPosition }) {
  const group = useRef()
  const snap = useSnapshot(state)

  useFrame((state, delta) => {
    easing.damp3(state.camera.position, [snap.intro ? -state.viewport.width / 500: 0, initialPosition[1], initialPosition[2]], 0.25, delta)
    easing.dampE(group.current.rotation, [Math.PI / 20, -state.pointer.x / 5, 0], 0.25, delta)
  })

  return <group ref={group}>{children}</group>
}

