export function setupRevealMotion(items) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  items.forEach((item, index) => {
    item.classList.add("reveal");
    item.style.transitionDelay = `${Math.min(index % 6, 4) * 55}ms`;
    revealObserver.observe(item);
  });
}

export function setupPressFeedback(items) {
  items.forEach((item) => {
    item.addEventListener("pointerdown", () => {
      item.style.transform = "translateY(-1px) scale(0.985)";
    });
    item.addEventListener("pointerup", () => {
      item.style.transform = "";
    });
    item.addEventListener("pointerleave", () => {
      item.style.transform = "";
    });
  });
}

export function setupQualityToggle(toggle, onChange) {
  toggle?.addEventListener("click", () => {
    const isLightweight = document.body.classList.toggle("is-lightweight");
    toggle.setAttribute("aria-pressed", String(isLightweight));
    onChange?.(isLightweight);
  });
}
