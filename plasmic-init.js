import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";

// Replace the id and token below with your Plasmic project id and API
// token. You can create a new token in the Plasmic project settings.
export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      // TODO: replace these with values from your Plasmic project
      id: "<YOUR_PROJECT_ID>",
      token: "<YOUR_PROJECT_API_TOKEN>",
    },
  ],
  // Set preview to true to use unpublished changes while developing.
  preview: false,
});

// You can register code components here so they show up as "Code components"
// inside the Plasmic editor once the editor is pointed at your app host.
// Example (uncomment + import a component):
// PLASMIC.registerComponent(MyButton, { name: "MyButton", props: { children: {type: 'slot'} } });
