import { useRef } from 'react';
import { useGLTF, useTexture} from '@react-three/drei'
import { useFrame } from '@react-three/fiber';

export default function Guitar({ position, rotation, ref }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const { nodes } = useGLTF(`${baseUrl}/objects/flying-v_guitar_1.glb`);



  return (
    <group
      ref={ref}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={-1}
      position={[position[0], position[1], position[2]]}
      dispose={null}
    >
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Scene.children[0].children[0].geometry}
        material={nodes.Scene.children[0].children[0].material}
        scale={-.0059}
        position={[.02, .76, .51]}
        rotation={[0, 4.933 / Math.PI , 0]}
        dispose={null}
        material-color="#0029ff"
        material-roughness={1}
      >
      </mesh>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Scene.children[0].children[1].geometry}
        material={nodes.Scene.children[0].children[1].material}
        scale={-.0059}
        position={[.02, .76, .51]}
        rotation={[0, 4.933 / Math.PI , 0]}
        dispose={null}
        material-roughness={1}
      >
      </mesh>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Scene.children[0].children[2].geometry}
        material={nodes.Scene.children[0].children[2].material}
        scale={-.0059}
        position={[.02, .76, .51]}
        rotation={[0, 4.933 / Math.PI , 0]}
        dispose={null}
        material-roughness={1}
      >
      </mesh>
    </group>
  );
}

const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
useGLTF.preload(`${baseUrl}/objects/flying-v_guitar.glb`)
;['/react.png', '/three2.png', '/pmndrs.png'].forEach(useTexture.preload)