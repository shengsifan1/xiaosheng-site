export function createNavigation({ header, menuToggle, spaceLinks, sectionToNode, onSpaceChange }) {
  let activeSpaceNode = "Home";

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  function navigateToSpace(target) {
    const section = document.querySelector(target);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", target);
  }

  function setActiveSpaceNode(node) {
    if (!node) return;
    activeSpaceNode = node;
    document.body.dataset.spaceNode = node.toLowerCase();
    spaceLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.node === node);
    });
    onSpaceChange?.(node);
  }

  function setupHeader() {
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();

    if (!menuToggle || !header) return;
    menuToggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("nav-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    header.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("nav-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function setupLinks() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = link.getAttribute("href");
        if (!target || target === "#") return;
        event.preventDefault();
        setActiveSpaceNode(link.dataset.node || sectionToNode[target.slice(1)]);
        navigateToSpace(target);
      });
    });

    document.querySelectorAll("[data-nav-target]").forEach((item) => {
      const target = item.dataset.navTarget;
      if (!target) return;
      item.addEventListener("click", () => navigateToSpace(target));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigateToSpace(target);
        }
      });
    });
  }

  function setupSectionObserver() {
    const spaceObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        setActiveSpaceNode(sectionToNode[visible.target.id]);
      },
      { threshold: [0.25, 0.5, 0.75] }
    );

    document.querySelectorAll("main > section[id]").forEach((section) => {
      spaceObserver.observe(section);
    });
  }

  function init() {
    setupHeader();
    setupLinks();
    setupSectionObserver();
    setActiveSpaceNode(activeSpaceNode);
  }

  return {
    init,
    navigateToSpace,
    setActiveSpaceNode,
    get activeSpaceNode() {
      return activeSpaceNode;
    },
  };
}
