import { useRef } from 'react';
import { useGLTF, useTexture} from '@react-three/drei'
import * as THREE from "three"

export default function DrumKick({position, rotation}) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const { nodes } = useGLTF(`${baseUrl}/objects/drum-kick.glb`);
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
        geometry={nodes.Scene.children[0].geometry}
        material={nodes.Scene.children[0].material}
        scale={-.0059}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        dispose={null}
        material-roughness={1}
        // renderOrder={4}
        // material-stencilWrite={true}
        // material-depthTest={false}
        // material-depthWrite={false}
        // material-stencilRef={stencilEnabled ? 1 : 0}
        // material-stencilFunc={stencilEnabled ? THREE.EqualStencilFunc : THREE.AlwaysStencilFunc}
        // material-stencilFail={THREE.KeepStencilOp}
        // material-stencilZFail={THREE.KeepStencilOp}
        // material-stencilZPass={THREE.KeepStencilOp}
      />
    </group>
  );
}

const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
useGLTF.preload(`${baseUrl}/objects/drum-set.glb`)
;['/react.png', '/three2.png', '/pmndrs.png'].forEach(useTexture.preload)