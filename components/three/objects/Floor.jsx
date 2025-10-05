`use client`
// Custom hook to get window scroll position
import { useGLTF, useTexture, Html } from '@react-three/drei'

export default function Floor({rotation, position, opacity = 1}) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const {nodes} = useGLTF(`${baseUrl}/objects/floor.glb`);

  console.log(nodes)
  return (
    <>
      <group
        scale={.3}
        position={[.16, -.0012, -.01]}
        rotation={[0, 0, 0]}
        dispose={null}
      >
        {nodes.Scene.children[0].children.map((mesh, i) => (
          
          <mesh
            key={`mesh-${i}`}
            // Do not cast shadow so it doesn't affect BackDrop accumulated shadow
            castShadow={false}
            receiveShadow
            geometry={mesh.geometry}
            material={mesh.material}
            scale={-.0059}
            
            position={[0, 0, 0]}
            dispose={null}
            material-roughness={.8}
          />
 
        ))}
      </group>
    </>
  );
}

const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
useGLTF.preload(`${baseUrl}/objects/floor.glb`)
;['/react.png', '/three2.png', '/pmndrs.png'].forEach(useTexture.preload)