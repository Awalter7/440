
import { useGLTF, useTexture} from '@react-three/drei'

export default function Guitar({rotation, position, opacity = 1}) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const { nodes } = useGLTF(`${baseUrl}/objects/flying-v_guitar.glb`);

  console.log(nodes)
  return (
    <>
      <group
        rotation={[-5 / Math.PI, 1.5 / Math.PI, -6.9 / Math.PI]}
        scale={0.21}
        position={[.1, 0, 0]}
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
                />
              );
            }
          })
        }
      </group>
    </>
  );
}

const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
useGLTF.preload(`${baseUrl}/objects/flying-v_guitar.glb`)
;['/react.png', '/three2.png', '/pmndrs.png'].forEach(useTexture.preload)