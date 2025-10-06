// LanderClient.js
import dynamic from "next/dynamic";

const LanderSceneClient = dynamic(() => import("./ThreeCanvas"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "100%", background: "#000" }}>Loading 3D scene...</div>
});

export default LanderSceneClient;