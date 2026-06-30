const glow = document.querySelector(".cursor-glow");
const releaseCards = [...document.querySelectorAll("[data-release-card]")];
const releaseDots = [...document.querySelectorAll("[data-release]")];
const releaseCount = document.querySelector("[data-release-count]");
let activeRelease = 0;
let releaseTimer;

window.addEventListener("pointermove", (event) => {
  if (!glow) return;
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

function setRelease(index) {
  activeRelease = index;
  releaseCards.forEach((card, cardIndex) => {
    card.classList.toggle("is-active", cardIndex === index);
  });
  releaseDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
  });
  if (releaseCount) {
    releaseCount.textContent = `${String(index + 1).padStart(2, "0")} / ${String(releaseCards.length).padStart(2, "0")}`;
  }
}

function startReleaseTimer() {
  window.clearInterval(releaseTimer);
  releaseTimer = window.setInterval(() => {
    setRelease((activeRelease + 1) % releaseCards.length);
  }, 3600);
}

releaseDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    setRelease(Number(dot.dataset.release));
    startReleaseTimer();
  });
});

startReleaseTimer();

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".section, .project-card, .skill-grid article").forEach((item) => {
  item.classList.add("reveal");
  observer.observe(item);
});
