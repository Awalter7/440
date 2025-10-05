import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "rdUbbFyBk8F7AduKnQeuGL",
      token: "ULH0HD4xX1eA3r6fDn3O94tMMi7NTqtzBvCgDVS1NZ9r9VMmmwCgYf9AEQxXfQPOjxPE3sE4dXzfAqCgbw",
    },
  ],

  // By default Plasmic will use the last published version of your project.
  // For development, you can set preview to true, which will use the unpublished
  // project, allowing you to see your designs without publishing.  Please
  // only use this for development, as this is significantly slower.
  preview: false,
});

// You can register any code components that you want to use here; see
// https://docs.plasmic.app/learn/code-components-ref/
// And configure your Plasmic project to use the host url pointing at
// the /plasmic-host page of your nextjs app (for example,
// http://localhost:3000/plasmic-host).  See
// https://docs.plasmic.app/learn/app-hosting/#set-a-plasmic-project-to-use-your-app-host

// PLASMIC.registerComponent(...);
import { registerComponent } from "@plasmicapp/host";
import Button from "./components/MyButton";
import LanderSceneClient from "./components/three/scenes/LanderClient"




registerComponent(LanderSceneClient, {
  name: "LanderScene",
  importPath: "./three/scenes/LanderClient",
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

registerComponent(Button, {
  name: "CustomButton",
  importPath: "./Button",
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
