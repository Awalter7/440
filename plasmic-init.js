// plasmic-init.js
import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";


export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "rdUbbFyBk8F7AduKnQeuGL",
      token: "ULH0HD4xX1eA3r6fDn3O94tMMi7NTqtzBvCgDVS1NZ9r9VMmmwCgYf9AEQxXfQPOjxPE3sE4dXzfAqCgbw",
    },
  ],
  preview: true,
});

// Import your components
import Button from "./components/MyButton";
import { LanderScene } from "./components/three/canvas/Lander";
import { CustomScroll } from "./components/effects/CustomScroll"

// Use PLASMIC.registerComponent instead of registerComponent
PLASMIC.registerComponent(LanderScene, {
  name: "LanderScene",
  importPath: "./components/three/canvas/Lander",
  props: {
    position: {
      type: "object",
      displayName: "Camera Position",
      defaultValue: [0, 0, 2],
    },
    fov: {
      type: "number",
      displayName: "Field of View",
      defaultValue: 25,
    },
    className: {
      type: "class",
      displayName: "CSS Class",
    },
  },
  styleProps: [
    "width",
    "height",
    "minWidth",
    "maxWidth", 
    "minHeight",
    "maxHeight",
    "position",
    "top",
    "left",
    "right",
    "bottom",
    "zIndex",
    "display",
    "flexDirection",
    "flexWrap",
    "justifyContent",
    "alignItems",
    "gap",
    "padding",
    "margin",
    "background",
    "backgroundColor",
    "border",
    "borderRadius",
    "overflow",
  ],
});

// Plasmic Registration
// Plasmic Registration
// Plasmic Registration
// Plasmic Registration
PLASMIC.registerComponent(CustomScroll, {
  name: "CustomScroll",
  displayName: "Custom Scroll Effect",
  description: "Animate position and opacity based on scroll (interpolation or duration-based)",
  props: {
    children: {
      type: "slot",
      defaultValue: {
        type: "text",
        value: "Scroll to animate",
      },
    },
    positionType: {
      type: "choice",
      options: ["fixed", "absolute", "relative"],
      defaultValue: "relative",
      displayName: "Position Type",
      description: "Position type (fixed, absolute, or relative. In studio, always shows as relative)",
    },
    animationMode: {
      type: "choice",
      options: ["interpolation", "duration"],
      defaultValue: "interpolation",
      displayName: "Animation Mode",
      description: "Interpolation: moves with scroll | Duration: animates over time when triggered",
    },
    duration: {
      type: "number",
      defaultValue: 1000,
      displayName: "Duration (ms)",
      description: "Animation duration in milliseconds (only for duration mode)",
      hidden: (props) => props.animationMode !== "duration",
    },
    startTop: {
      type: "string",
      displayName: "Start Top",
      description: "Initial top position (e.g., '100px', '50vh', '10%')",
      defaultValueHint: "0px",
    },
    startLeft: {
      type: "string",
      displayName: "Start Left",
      description: "Initial left position (e.g., '0px', '25vw')",
      defaultValueHint: "0px",
    },
    startRight: {
      type: "string",
      displayName: "Start Right",
      description: "Initial right position (e.g., '0px', '10vw')",
      defaultValueHint: "0px",
    },
    startBottom: {
      type: "string",
      displayName: "Start Bottom",
      description: "Initial bottom position (e.g., '20px', '5vh')",
      defaultValueHint: "0px",
    },
    endTop: {
      type: "string",
      displayName: "End Top",
      description: "Final top position (e.g., '500px', '80vh')",
      defaultValueHint: "0px",
    },
    endLeft: {
      type: "string",
      displayName: "End Left",
      description: "Final left position (e.g., '100px', '50vw')",
      defaultValueHint: "0px",
    },
    endRight: {
      type: "string",
      displayName: "End Right",
      description: "Final right position (e.g., '100px', '20vw')",
      defaultValueHint: "0px",
    },
    endBottom: {
      type: "string",
      displayName: "End Bottom",
      description: "Final bottom position (e.g., '100px', '10vh')",
      defaultValueHint: "0px",
    },
    scrollStart: {
      type: "number",
      defaultValue: 0,
      displayName: "Scroll Start (px)",
      description: "Interpolation: animation start | Duration: trigger point",
    },
    scrollEnd: {
      type: "number",
      defaultValue: 1000,
      displayName: "Scroll End (px)",
      description: "Scroll position where interpolation completes (interpolation mode only)",
      hidden: (props) => props.animationMode !== "interpolation",
    },
    startOpacity: {
      type: "number",
      defaultValue: 1,
      min: 0,
      max: 1,
      displayName: "Start Opacity",
      description: "Initial opacity (0-1)",
    },
    endOpacity: {
      type: "number",
      defaultValue: 1,
      min: 0,
      max: 1,
      displayName: "End Opacity",
      description: "Final opacity (0-1)",
    },
    zIndex: {
      type: "number",
      defaultValue: 1000,
      displayName: "Z-Index",
      description: "Stacking order",
    },
  },
  importPath: "./components/effects/CustomScroll",
  isDefaultExport: false,
});