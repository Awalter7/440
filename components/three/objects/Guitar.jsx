
import { useGLTF, useTexture} from '@react-three/drei'

export default function Guitar({rotation, position, opacity = 1}) {
  const {nodes} = useGLTF('/gibson_les_paul_and_marshall_amp.glb');

  return (
    <>
      <group
        scale={20}
        position={position || [0, 0, 0]}
        rotation={[0, 0, 0]}
        dispose={null}
      >
        {nodes.Sketchfab_model.children[0].children[0].children.map((child, i) => (
          child.children.map((mesh, j) => (
            <mesh
              key={`mesh-${i}-${j}`}
              castShadow
              receiveShadow
              geometry={mesh.geometry}
              material={mesh.material}
              scale={(i === 3 && j === 0) ? .011 : i === 2 ? .00039 : .03}
              rotation={(i === 3 && j === 0) ? [-Math.PI / 15, 0, Math.PI / 2] : i === 2 ? [-Math.PI / 1, -Math.PI / 2, -Math.PI / 2.2] : [-Math.PI / 2, 0, Math.PI / 2]}
              position={(i === 3 && j === 0) ? [.005, .0367, .00701] : (i === 4 && j === 0) || (i === 4 && j === 1) ? [-.00015, .0014, .0125] : i === 2 ? [.0050, .0067, .0134] : [0, 0, 0]}
              dispose={null}
              material-roughness={.2}
            />
          ))
        ))}
      </group>
    </>
  );
}

useGLTF.preload('/gibson_les_paul_and_marshall_amp.glb')
;['/react.png', '/three2.png', '/pmndrs.png'].forEach(useTexture.preload)