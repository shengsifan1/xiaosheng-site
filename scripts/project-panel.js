export function createProjectPanel({ projects, panel, title, type, body }) {
  let lastFocusedElement = null;

  function renderProjectBody(project) {
    const fields = [
      ["项目背景", project.background],
      ["目标", project.goal],
      ["页面职责", project.role],
      ["设计难点", project.challenge],
      ["解决方法", project.solution],
      ["交付内容", project.deliverable],
      ["复盘", project.review],
    ];

    return (
      fields.map(([fieldTitle, text]) => `<section><h3>${fieldTitle}</h3><p>${text}</p></section>`).join("") +
      `<section><h3>相关能力</h3><p>${project.skills.join(" / ")}</p></section>`
    );
  }

  function open(projectId) {
    const project = projects.find((item) => item.id === projectId);
    if (!project || !panel) return;

    lastFocusedElement = document.activeElement;
    title.textContent = project.title;
    type.textContent = project.type;
    body.innerHTML = renderProjectBody(project);
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    panel.querySelector("[data-close-panel]")?.focus();
  }

  function close() {
    if (!panel) return;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function init() {
    document.querySelectorAll("[data-project-id]").forEach((item) => {
      item.addEventListener("click", () => open(item.dataset.projectId));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(item.dataset.projectId);
        }
      });
    });

    document.querySelectorAll("[data-close-panel]").forEach((item) => {
      item.addEventListener("click", close);
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  return { init, open, close };
}
