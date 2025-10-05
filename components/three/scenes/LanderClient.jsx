import LanderScene from "./Lander";
import dynamic from "next/dynamic";

// Dynamically import to disable SSR
const LanderSceneClient = dynamic(() => import("./Lander"), {
  ssr: false,
});

export default LanderSceneClient;