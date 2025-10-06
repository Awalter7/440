import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function Floor({ animatedPosition, animatedRotation, animatedOpacity }) {
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
      if (animatedOpacity !== undefined && meshRef.current.material) {
        meshRef.current.material.opacity = animatedOpacity;
      }
    }
  });

  

  return (
    <mesh
      ref={meshRef}
      rotation={[animatedRotation[0], animatedRotation[1], animatedRotation[2]]}
      position={[animatedPosition[0], animatedPosition[1], animatedPosition[2]]}
      renderOrder={0} // Floor renders first
      castShadow
      receiveShadow
    >
      <planeGeometry args={[100, 100, 1]} />
        <meshPhysicalMaterial
            color="#000000"
            transparent={animatedOpacity === 1 ? false : true}
            opacity={animatedOpacity}
            depthWrite={true}  // <== Add this
        />
    </mesh>
  );
}