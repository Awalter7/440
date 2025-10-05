// Custom hook to get window scroll position
import {Canvas} from '@react-three/fiber'
import {Environment} from '@react-three/drei'
import OrbitalRig from '../rigs/OrbitalRig'
import Backdrop from '../objects/Backdrop'
import Guitar from '../objects/Guitar'

export const LanderScene = ({ position = [0, 0, 2], fov = 25 }) => (
  <Canvas shadows camera={{ position, fov }}  style={{backgroundColor: "transparent", height: "100vh", width: "100vw", zIndex: 2}} gl={{ preserveDrawingBuffer: true}} eventSource={document.getElementById('root')} eventPrefix="client">
      <fog attach="fog" color="black" near={1} far={3.5} />
      <OrbitalRig >
        <Guitar position={[0, -.30, 0]}/>
        <Backdrop position={[0, -.295, 0]}/>
        <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr" />
      </OrbitalRig>
  </Canvas>
)


