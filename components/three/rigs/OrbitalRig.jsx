// Custom hook to get window scroll position
import { useRef} from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useSnapshot } from 'valtio'
import { state } from '../store'

export default function OrbitalRig({ children }) {
  const group = useRef()
  const snap = useSnapshot(state)

  useFrame((state, delta) => {
    easing.damp3(state.camera.position, [snap.intro ? -state.viewport.width / 15: 0, .35, .45], 0.25, delta)
    easing.dampE(group.current.rotation, [-state.pointer.x / 20, -state.pointer.y / 20, Math.PI / 4], 0.25, delta)
  })
  return <group ref={group}>{children}</group>
}

