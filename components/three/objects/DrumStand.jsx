import { useRef } from 'react';
import { useGLTF, useTexture} from '@react-three/drei'
import { useFrame } from '@react-three/fiber';

export default function DrumStand({ position, rotation }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const { nodes } = useGLTF(`${baseUrl}/objects/drum-stand.glb`);
  const groupRef = useRef();


  return (
    <group
      ref={groupRef}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={.09}
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
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Scene.children[0].children[1].geometry}
        material={nodes.Scene.children[0].children[1].material}
        scale={-.0059}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        dispose={null}
        material-color={"#0029ff"}
        material-roughness={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Scene.children[0].children[2].geometry}
        material={nodes.Scene.children[0].children[2].material}
        scale={-.0059}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        dispose={null}
        material-roughness={1}
      />
      {/* {
        nodes.Sketchfab_model.children[0].children.map((mesh, index) => {
          if (index === 1 || index === 0) {
            return (
              <mesh
                key={index}
                castShadow
                receiveShadow
                geometry={mesh.children[0].geometry}
                material={mesh.children[0].material}
                scale={-.0059}
                position={[.02, .76, .51]}
                rotation={[0, 4.933 / Math.PI , 0]}
                dispose={null}
                material-roughness={1}
                material-transparent={true}
                material-opacity={animatedOpacity}
              />
            );
          } else if (index === 2) {
            return null;
          } else {
            return (
              <mesh
                key={index}
                castShadow
                receiveShadow
                geometry={mesh.children[0].geometry}
                material={mesh.children[0].material}
                dispose={null}
                material-roughness={1}
                material-transparent={true}
                material-opacity={animatedOpacity}
              />
            );
          }
        })
      } */}
    </group>
  );
}

const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
useGLTF.preload(`${baseUrl}/objects/drum-set.glb`)
;['/react.png', '/three2.png', '/pmndrs.png'].forEach(useTexture.preload)