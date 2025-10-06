import { useGLTF, useTexture, useAnimations } from '@react-three/drei'
import { useEffect, useRef } from 'react'

export default function Paper({ rotation, position, opacity = 1 }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const group = useRef();

  // Load GLTF
  const { scene, animations } = useGLTF(`${baseUrl}/objects/paper.glb`);

  // Hook up animations to the group
  const { actions, names } = useAnimations(animations, group);

  // Play first animation
  useEffect(() => {
    console.log("Animations:", animations);
    console.log("Actions:", actions);
    console.log("Names:", names);
    

    if (actions && names.length > 0) {
      const action = actions[names[0]];
      if (action) {
        action.reset().fadeIn(0.5).play();
      }
    }
  }, [actions, names]);

  return (
    <group
      ref={group}
      rotation={rotation || [0, 0, 0]}
      scale={0.21}
      position={position || [0, 0, 0]}
      dispose={null}
    >
      {/* Add the actual GLTF scene */}
      <primitive object={scene} />
    </group>
  );
}

// Preload model
const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
useGLTF.preload(`${baseUrl}/objects/paper.glb`);
['/react.png', '/three2.png', '/pmndrs.png'].forEach(useTexture.preload);
