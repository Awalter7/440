// LanderClient.js
import dynamic from "next/dynamic";

const LanderSceneClient = dynamic(() => import("./ThreeCanvas"), {
  ssr: false,
});

export default LanderSceneClient;