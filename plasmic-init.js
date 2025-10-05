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

// Remove this line:
// import { registerComponent } from "@plasmicapp/host";

// Import your components
import Button from "./components/MyButton";
import { LanderScene } from "./components/three/scenes/Lander"; // Import the actual component

// Use PLASMIC.registerComponent instead of registerComponent
PLASMIC.registerComponent(LanderScene, {
  name: "LanderScene",
  importPath: "./components/three/scenes/Lander",
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
  },
});

PLASMIC.registerComponent(Button, {
  name: "CustomButton",
  importPath: "./components/MyButton",
  props: {
    children: {
      type: "slot",
      defaultValue: "Click me",
    },
    variant: {
      type: "choice",
      options: ["primary", "secondary", "ghost", "danger"],
      defaultValue: "primary",
    },
    size: {
      type: "choice",
      options: ["sm", "md", "lg"],
      defaultValue: "md",
    },
    isLoading: {
      type: "boolean",
      defaultValue: false,
    },
    leftIcon: {
      type: "slot",
    },
    rightIcon: {
      type: "slot",
    },
    href: {
      type: "string",
    },
    className: {
      type: "string",
    },
    ariaLabel: {
      type: "string",
    },
  },
});