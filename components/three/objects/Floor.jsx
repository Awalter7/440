import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function Floor({ animatedPosition, animatedRotation }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      if (animatedPosition) {
        meshRef.current.position.set(
          animatedPosition[0],
          animatedPosition[1],
          animatedPosition[2]
        );
      }
      if (animatedRotation) {
        meshRef.current.rotation.set(
          animatedRotation[0],
          animatedRotation[1],
          animatedRotation[2]
        );
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[animatedRotation[0], animatedRotation[1], animatedRotation[2]]}
      position={[animatedPosition[0], animatedPosition[1], animatedPosition[2]]}
      castShadow
      receiveShadow
    >
      <planeGeometry args={[100, 100, 1]} />
      <meshBasicMaterial color="white" />
    </mesh>
  );
}