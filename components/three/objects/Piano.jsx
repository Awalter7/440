import { useRef } from 'react';
import { useGLTF, useTexture} from '@react-three/drei'
import { useFrame } from '@react-three/fiber';

export default function Piano({ position, rotation }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const { nodes } = useGLTF(`${baseUrl}/objects/piano.glb`);
  const groupRef = useRef();


  return (
    <group
      ref={groupRef}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={100}
      position={[position[0], position[1], position[2]]}
      dispose={null}
    >
        <mesh
            castShadow
            receiveShadow
            geometry={nodes.Scene.children[0].children[0].geometry}
            material={nodes.Scene.children[0].children[0].material}
            scale={-.0059}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            dispose={null}
            material-roughness={1}
            material-color="#1500ff"
        />
        <mesh
            castShadow
            receiveShadow
            geometry={nodes.Scene.children[0].children[1].geometry}
            material={nodes.Scene.children[0].children[1].material}
            material-color={"#0b0549"}
            scale={-.0059}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            dispose={null}
            material-roughness={1}
            
        />
        <mesh
            castShadow
            receiveShadow
            geometry={nodes.Scene.children[0].children[2].geometry}
            material={nodes.Scene.children[0].children[2].material}
            material-color={"#16114e"}
            scale={-.0059}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            dispose={null}
            material-roughness={1}
            
        />
        <mesh
            castShadow
            receiveShadow
            geometry={nodes.Scene.children[0].children[3].geometry}
            material={nodes.Scene.children[0].children[3].material}
            material-color={"#191261"}
            scale={-.0059}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            dispose={null}
            material-roughness={1}
        />
    </group>
  );
}

const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
useGLTF.preload(`${baseUrl}/objects/drum-set.glb`)
;['/react.png', '/three2.png', '/pmndrs.png'].forEach(useTexture.preload)