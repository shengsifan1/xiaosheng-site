export function createWorldScene({ canvas, projects, getActiveNode }) {
  if (!canvas) {
    return { start() {}, setPaused() {} };
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let paused = false;
  let frameId = 0;

  const state = {
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    pointerX: 0,
    pointerY: 0,
    targetX: 0,
    targetY: 0,
    scrollDepth: 0,
    targetDepth: 0,
    time: 0,
  };

  const nodes = [
    { label: "Prompt", x: -20, y: -148, z: 310, color: "#d9ff8f" },
    { label: "Data", x: -180, y: -54, z: 260, color: "#9de7ff" },
    { label: "Quality", x: -215, y: 112, z: 120, color: "#c8bcff" },
    { label: "Projects", x: 150, y: -20, z: 230, color: "#9de7ff" },
    { label: "Workflow", x: -20, y: 132, z: 180, color: "#ffffff" },
    { label: "Tools", x: 260, y: 82, z: 120, color: "#c8bcff" },
  ];

  const stars = Array.from({ length: window.innerWidth < 760 ? 70 : 130 }, (_, index) => ({
    x: Math.sin(index * 17.23) * 620,
    y: Math.cos(index * 11.71) * 360,
    z: 40 + ((index * 97) % 520),
    size: 0.7 + ((index * 13) % 17) / 18,
  }));

  const projectIslands = projects.map((project, index) => ({
    label: project.type,
    x: -300 + (index % 3) * 230,
    y: 230 + Math.floor(index / 3) * 72,
    z: 160 + index * 34,
    color: index % 2 ? "#c8bcff" : "#9de7ff",
  }));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.width = rect.width;
    state.height = rect.height;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * state.dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * state.dpr));
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function project(point, rotation, lift = 0) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const depth = state.scrollDepth;
    const x = point.x * cos - point.z * sin;
    const z = Math.max(160, point.x * sin + point.z * cos + 760 - depth * 300);
    const y = point.y + lift + depth * 110;
    const scale = 390 / z;
    return {
      x: state.width * (0.74 - depth * 0.05) + x * scale + state.pointerX * 28,
      y: state.height * (0.42 + depth * 0.08) + y * scale + state.pointerY * 22,
      z,
      scale,
    };
  }

  function drawPath(points, color) {
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  function drawGrid(rotation) {
    ctx.lineWidth = 1;
    for (let row = -5; row <= 5; row += 1) {
      const path = [];
      for (let col = -7; col <= 7; col += 1) {
        path.push(project({ x: col * 74, y: 180, z: row * 74 + 180 }, rotation));
      }
      drawPath(path, "rgba(157, 231, 255, 0.16)");
    }
    for (let col = -7; col <= 7; col += 1) {
      const path = [];
      for (let row = -5; row <= 5; row += 1) {
        path.push(project({ x: col * 74, y: 180, z: row * 74 + 180 }, rotation));
      }
      drawPath(path, "rgba(255, 255, 255, 0.1)");
    }
  }

  function drawNode(node, rotation) {
    const point = project(node, rotation, reducedMotion ? 0 : Math.sin(state.time * 0.0016 + node.x) * 8);
    const isActive = node.label === getActiveNode();
    const radius = Math.max(isActive ? 7 : 5, (isActive ? 20 : 14) * point.scale);
    const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 5);
    glow.addColorStop(0, node.color);
    glow.addColorStop(0.22, isActive ? `${node.color}cc` : `${node.color}88`);
    glow.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = node.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isActive ? "rgba(217,255,143,0.72)" : "rgba(255,255,255,0.44)";
    ctx.lineWidth = isActive ? 1.8 : 1;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * (isActive ? 2.8 : 2.2), 0, Math.PI * 2);
    ctx.stroke();

    const labelWidth = Math.max(72, node.label.length * 10 + 34);
    const labelX = point.x - labelWidth / 2;
    const labelY = point.y + radius * 1.6;
    ctx.fillStyle = "rgba(13,17,24,0.66)";
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(labelX, labelY, labelWidth, 26, 13);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = node.color;
    ctx.beginPath();
    ctx.arc(labelX + 16, labelY + 13, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "700 12px Inter, Microsoft YaHei, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, labelX + 27, labelY + 13);
  }

  function drawConnections(projected) {
    const pairs = [[0, 1], [1, 2], [2, 5], [0, 3], [3, 4], [4, 2]];
    pairs.forEach(([from, to]) => {
      const a = projected[from];
      const b = projected[to];
      const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      gradient.addColorStop(0, "rgba(217, 255, 143, 0.44)");
      gradient.addColorStop(1, "rgba(157, 231, 255, 0.18)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
  }

  function drawStars(rotation) {
    stars.forEach((star) => {
      const point = project(star, rotation * 0.4, 0);
      const alpha = Math.max(0.12, Math.min(0.62, point.scale * 1.5));
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(point.x, point.y, star.size, star.size);
    });
  }

  function drawIsland(island, rotation) {
    const point = project(island, rotation, reducedMotion ? 0 : Math.sin(state.time * 0.001 + island.x) * 5);
    const width = 54 * point.scale;
    const height = 22 * point.scale;
    ctx.fillStyle = "rgba(157, 231, 255, 0.18)";
    ctx.strokeStyle = "rgba(217, 255, 143, 0.32)";
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, width, height, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function render(time) {
    if (paused) {
      frameId = requestAnimationFrame(render);
      return;
    }

    state.time = time;
    state.pointerX += (state.targetX - state.pointerX) * 0.045;
    state.pointerY += (state.targetY - state.pointerY) * 0.045;
    state.scrollDepth += (state.targetDepth - state.scrollDepth) * (reducedMotion ? 0.16 : 0.04);
    const rotation = reducedMotion ? state.scrollDepth * 0.32 : time * 0.00016 + state.pointerX * 0.15 + state.scrollDepth * 0.72;

    ctx.clearRect(0, 0, state.width, state.height);
    drawStars(rotation);
    drawGrid(rotation);
    projectIslands.forEach((island) => drawIsland(island, rotation));
    const projected = nodes.map((node) => project(node, rotation));
    drawConnections(projected);
    nodes.forEach((node) => drawNode(node, rotation));
    frameId = requestAnimationFrame(render);
  }

  function setPaused(nextPaused) {
    paused = nextPaused;
    if (paused) ctx.clearRect(0, 0, state.width, state.height);
  }

  function start() {
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      state.targetDepth = Math.min(1, window.scrollY / maxScroll);
    }, { passive: true });
    window.addEventListener("pointermove", (event) => {
      state.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      state.targetY = (event.clientY / window.innerHeight - 0.5) * 2;
    });
    frameId = requestAnimationFrame(render);
  }

  function dispose() {
    cancelAnimationFrame(frameId);
  }

  return { start, setPaused, dispose };
}
