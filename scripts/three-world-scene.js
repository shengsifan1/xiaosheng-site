import * as THREE from "three";

export function createThreeWorldScene({ canvas, projects, getActiveNode, onProjectSelect }) {
  if (!canvas) return { start() {}, setPaused() {}, dispose() {} };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lowPower = window.innerWidth < 760 || navigator.hardwareConcurrency <= 4;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !lowPower,
    alpha: true,
    powerPreference: lowPower ? "low-power" : "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07101f, 0.035);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
  camera.position.set(0, 1.3, 8.2);

  const root = new THREE.Group();
  scene.add(root);

  const ambient = new THREE.AmbientLight(0x9de7ff, 0.52);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xd9ff8f, 1.2);
  key.position.set(4, 5, 6);
  scene.add(key);

  const rim = new THREE.PointLight(0xc8bcff, 3.2, 18);
  rim.position.set(-4, 2, -2);
  scene.add(rim);

  const grid = new THREE.GridHelper(16, 42, 0x9de7ff, 0x32506b);
  grid.position.y = -1.8;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  root.add(grid);

  const starCount = lowPower ? 420 : 900;
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    starPositions[i * 3] = (Math.random() - 0.5) * 18;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.018, transparent: true, opacity: 0.72 })
  );
  root.add(stars);

  function createLabelSprite(label, color) {
    const canvasLabel = document.createElement("canvas");
    const context = canvasLabel.getContext("2d");
    const width = 280;
    const height = 88;
    canvasLabel.width = width;
    canvasLabel.height = height;

    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(13, 17, 24, 0.68)";
    context.strokeStyle = "rgba(255, 255, 255, 0.24)";
    context.lineWidth = 2;
    const radius = 26;
    const x = 18;
    const y = 18;
    const w = width - 36;
    const h = 52;
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + w - radius, y);
    context.quadraticCurveTo(x + w, y, x + w, y + radius);
    context.lineTo(x + w, y + h - radius);
    context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    context.lineTo(x + radius, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    context.shadowColor = context.fillStyle;
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(48, 44, 9, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;

    context.fillStyle = "rgba(255,255,255,0.9)";
    context.font = "700 25px Inter, Microsoft YaHei, sans-serif";
    context.textBaseline = "middle";
    context.fillText(label, 70, 44);

    const texture = new THREE.CanvasTexture(canvasLabel);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        opacity: 0.92,
      })
    );
    sprite.scale.set(1.18, 0.37, 1);
    sprite.userData.texture = texture;
    return sprite;
  }

  const nodeData = [
    { label: "Prompt", position: [-0.35, 1.45, -1.7], color: 0xd9ff8f, labelOffset: [0.08, -0.36, 0.04] },
    { label: "Data", position: [-2.1, 0.45, -1.1], color: 0x9de7ff, labelOffset: [-0.08, -0.36, 0.04] },
    { label: "Quality", position: [-2.35, -1.05, -0.4], color: 0xc8bcff, labelOffset: [0.2, -0.3, 0.04] },
    { label: "Projects", position: [1.2, 0.2, -0.8], color: 0x9de7ff, labelOffset: [0.28, -0.35, 0.04] },
    { label: "Workflow", position: [-0.25, -1.15, -0.75], color: 0xffffff, labelOffset: [0.24, -0.34, 0.04] },
    { label: "Tools", position: [2.45, -0.78, -1.05], color: 0xc8bcff, labelOffset: [0.18, -0.32, 0.04] },
  ];

  const nodeMeshes = nodeData.map((node) => {
    const group = new THREE.Group();
    group.position.set(...node.position);
    group.userData.label = node.label;

    const material = new THREE.MeshStandardMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.85,
      metalness: 0.2,
      roughness: 0.36,
    });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 2), material);
    mesh.userData.label = node.label;
    group.add(mesh);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.27, 0.29, 48),
      new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.userData.label = node.label;
    group.add(ring);

    const label = createLabelSprite(node.label, node.color);
    label.position.set(...node.labelOffset);
    label.userData.label = node.label;
    group.add(label);

    group.userData.mesh = mesh;
    group.userData.ring = ring;
    group.userData.labelSprite = label;
    root.add(group);
    return group;
  });

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x9de7ff, transparent: true, opacity: 0.28 });
  const linePairs = [[0, 1], [1, 2], [2, 5], [0, 3], [3, 4], [4, 2]];
  linePairs.forEach(([from, to]) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([nodeMeshes[from].position, nodeMeshes[to].position]);
    root.add(new THREE.Line(geometry, lineMaterial));
  });

  const islands = projects.map((project, index) => {
    const group = new THREE.Group();
    const angle = (index / projects.length) * Math.PI * 2;
    const radius = 2.7 + (index % 2) * 0.45;
    group.position.set(Math.cos(angle) * radius, -1.05 + (index % 3) * 0.24, Math.sin(angle) * radius - 1.8);
    group.rotation.y = -angle;
    group.userData.projectId = project.id;

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.72, 0.18, 7),
      new THREE.MeshStandardMaterial({
        color: index % 2 ? 0x253a68 : 0x1c5962,
        emissive: index % 2 ? 0x1f2b58 : 0x17484f,
        emissiveIntensity: 0.35,
        metalness: 0.42,
        roughness: 0.5,
      })
    );
    group.add(base);

    const beacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshStandardMaterial({
        color: index % 2 ? 0xc8bcff : 0x9de7ff,
        emissive: index % 2 ? 0xc8bcff : 0x9de7ff,
        emissiveIntensity: 1.2,
        roughness: 0.2,
      })
    );
    beacon.position.y = 0.34;
    group.add(beacon);
    group.userData.beacon = beacon;

    root.add(group);
    return group;
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  let paused = false;
  let targetDepth = 0;
  let scrollDepth = 0;
  let frameId = 0;

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function pick() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(islands, true);
    const next = hits.find((hit) => hit.object.parent?.userData.projectId)?.object.parent || null;
    if (hovered && hovered !== next) hovered.scale.setScalar(1);
    hovered = next;
    if (hovered) hovered.scale.setScalar(1.08);
    canvas.style.cursor = hovered ? "pointer" : "default";
  }

  function handleClick() {
    if (hovered?.userData.projectId) onProjectSelect?.(hovered.userData.projectId);
  }

  function render(time) {
    if (paused) {
      frameId = requestAnimationFrame(render);
      return;
    }

    scrollDepth += (targetDepth - scrollDepth) * (reducedMotion ? 0.16 : 0.045);
    const t = time * 0.001;
    const activeNode = getActiveNode();

    root.rotation.y = reducedMotion ? scrollDepth * 0.35 : t * 0.055 + scrollDepth * 0.7 + pointer.x * 0.05;
    root.position.z = scrollDepth * 1.6;
    camera.position.x += (pointer.x * 0.28 - camera.position.x) * 0.04;
    camera.position.y += (1.3 + pointer.y * 0.18 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -1.2);

    nodeMeshes.forEach((mesh, index) => {
      const isActive = mesh.userData.label === activeNode;
      const pulse = reducedMotion ? 1 : 1 + Math.sin(t * 2 + index) * 0.045;
      mesh.scale.setScalar((isActive ? 1.16 : 1) * pulse);
      mesh.userData.mesh.material.emissiveIntensity = isActive ? 1.8 : 0.78;
      mesh.userData.ring.material.opacity = isActive ? 0.76 : 0.38;
      mesh.userData.labelSprite.material.opacity = isActive ? 1 : 0.86;
    });

    islands.forEach((island, index) => {
      if (!reducedMotion) {
        island.position.y += (Math.sin(t * 0.8 + index) * 0.035) * 0.04;
        island.userData.beacon.rotation.y += 0.01;
      }
    });

    stars.rotation.y = t * 0.012;
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  }

  function setPaused(nextPaused) {
    paused = nextPaused;
    if (paused) renderer.clear();
  }

  function start() {
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      targetDepth = Math.min(1, window.scrollY / maxScroll);
    }, { passive: true });
    window.addEventListener("pointermove", (event) => {
      updatePointer(event);
      pick();
    });
    window.addEventListener("click", handleClick);
    frameId = requestAnimationFrame(render);
  }

  function dispose() {
    cancelAnimationFrame(frameId);
    renderer.dispose();
    starGeometry.dispose();
    lineMaterial.dispose();
    nodeMeshes.forEach((mesh) => {
      mesh.userData.mesh.geometry.dispose();
      mesh.userData.mesh.material.dispose();
      mesh.userData.ring.geometry.dispose();
      mesh.userData.ring.material.dispose();
      mesh.userData.labelSprite.material.map.dispose();
      mesh.userData.labelSprite.material.dispose();
    });
  }

  return { start, setPaused, dispose };
}
