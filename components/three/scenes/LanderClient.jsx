import LanderScene from "./Lander";

// Dynamically import to disable SSR
export default LanderSceneClient = dynamic(() => import("./components/three/scenes/Lander"), {
  ssr: false,
});