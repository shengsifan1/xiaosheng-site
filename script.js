import { projects } from "./site-data.js";
import { createNavigation } from "./scripts/navigation.js";
import { createProjectPanel } from "./scripts/project-panel.js";
import { setupPressFeedback, setupQualityToggle, setupRevealMotion } from "./scripts/motion.js";
import { createWorldScene } from "./scripts/world-scene.js";

const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const worldCanvas = document.querySelector("[data-world-canvas]");
const qualityToggle = document.querySelector("[data-quality-toggle]");

const sectionToNode = {
  home: "Projects",
  about: "Data",
  insights: "Prompt",
  marble: "Workflow",
  community: "Projects",
  cases: "Quality",
  learn: "Workflow",
  api: "Tools",
  spark: "Tools",
};

const navigation = createNavigation({
  header,
  menuToggle,
  spaceLinks: document.querySelectorAll(".world-nav-node"),
  sectionToNode,
});

const projectPanel = createProjectPanel({
  projects,
  panel: document.querySelector("[data-project-panel]"),
  title: document.querySelector("[data-project-title]"),
  type: document.querySelector("[data-project-type]"),
  body: document.querySelector("[data-project-body]"),
});

let worldScene = createWorldScene({
  canvas: worldCanvas,
  projects,
  getActiveNode: () => navigation.activeSpaceNode,
});

async function createScene() {
  if (document.body.classList.contains("is-lightweight")) return worldScene;

  try {
    const { createThreeWorldScene } = await import("./scripts/three-world-scene.js");
    return createThreeWorldScene({
      canvas: worldCanvas,
      projects,
      getActiveNode: () => navigation.activeSpaceNode,
      onProjectSelect: (projectId) => projectPanel.open(projectId),
    });
  } catch (error) {
    console.info("Three.js scene unavailable, using Canvas fallback.", error);
    return worldScene;
  }
}

setupRevealMotion(
  document.querySelectorAll(
    ".hero-copy, .hero-index, .section, .insight-grid article, .media-card, .case-list article"
  )
);
setupPressFeedback(document.querySelectorAll(".button, [data-nav-target], [data-project-id]"));
setupQualityToggle(qualityToggle, (isLightweight) => worldScene.setPaused(isLightweight));

navigation.init();
projectPanel.init();
createScene().then((scene) => {
  worldScene = scene;
  worldScene.start();
});
