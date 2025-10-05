`use client`
import { useRef} from 'react'
import { useFrame } from '@react-three/fiber'
import { AccumulativeShadows, RandomizedLight } from '@react-three/drei'

export default function Backdrop(props) {
  const shadows = useRef()
  useFrame(() => {
    const mesh = shadows.current.getMesh()
    if (mesh && mesh.material) {
      mesh.material.color.set('#222') // Set to a dark gray for visible shadows
    }
  })
  return (
    <AccumulativeShadows
      ref={shadows}
      temporal
      frames={100}
      alphaTest={0.85}
      scale={5}
      resolution={2048}
      rotation={[0, Math.PI / 2, 0]}
      position={props.position || [0, -.25, -.2]}>
      <RandomizedLight amount={6} radius={9} intensity={1.2 * Math.PI} ambient={0} position={[5, 5, -10]} />
      <RandomizedLight amount={6} radius={10} intensity={0.2 * Math.PI} ambient={0} position={[-5, 5, -9]} />
    </AccumulativeShadows>
  )
}

