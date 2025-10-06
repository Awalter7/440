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
PLASMIC.registerComponent(CustomScroll, {
  name: "CustomScroll",
  displayName: "Custom Scroll Effect",
  description: "Animate position and opacity based on scroll position (supports px, vw, vh, %, em, rem)",
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
      options: ["fixed", "absolute"],
      defaultValue: "fixed",
      displayName: "Position Type",
      description: "Position type (only applies on frontend, stays relative in studio)",
    },
    startTop: {
      type: "string",
      displayName: "Start Top",
      description: "Initial top position (e.g., '100px', '50vh', '10%')",
    },
    startLeft: {
      type: "string",
      displayName: "Start Left",
      description: "Initial left position (e.g., '0px', '25vw')",
    },
    startRight: {
      type: "string",
      displayName: "Start Right",
      description: "Initial right position (e.g., '0px', '10vw')",
    },
    startBottom: {
      type: "string",
      displayName: "Start Bottom",
      description: "Initial bottom position (e.g., '20px', '5vh')",
    },
    endTop: {
      type: "string",
      displayName: "End Top",
      description: "Final top position (e.g., '500px', '80vh')",
    },
    endLeft: {
      type: "string",
      displayName: "End Left",
      description: "Final left position (e.g., '100px', '50vw')",
    },
    endRight: {
      type: "string",
      displayName: "End Right",
      description: "Final right position (e.g., '100px', '20vw')",
    },
    endBottom: {
      type: "string",
      displayName: "End Bottom",
      description: "Final bottom position (e.g., '100px', '10vh')",
    },
    scrollStart: {
      type: "number",
      defaultValue: 0,
      displayName: "Scroll Start (px)",
      description: "Scroll position (from top) where animation begins",
    },
    scrollEnd: {
      type: "number",
      defaultValue: 1000,
      displayName: "Scroll End (px)",
      description: "Scroll position (from top) where animation completes",
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
  importPath: "./CustomScroll",
  isDefaultExport: false,
});