import { useRef } from 'react';
import { useGLTF, useTexture} from '@react-three/drei'
import { useFrame } from '@react-three/fiber';

export default function Drums({ animatedPosition, animatedRotation, animatedOpacity }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const { nodes } = useGLTF(`${baseUrl}/objects/drum-set.glb`);
  const groupRef = useRef();


  console.log(nodes)
  return (
    <group
      ref={groupRef}
      rotation={[animatedRotation[0], animatedRotation[1], animatedRotation[2]]}
      scale={0.21}
      position={[animatedPosition[0], animatedPosition[1], animatedPosition[2]]}
      dispose={null}
    >
      {
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
      }
    </group>
  );
}

const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
useGLTF.preload(`${baseUrl}/objects/drum-set.glb`)
;['/react.png', '/three2.png', '/pmndrs.png'].forEach(useTexture.preload)