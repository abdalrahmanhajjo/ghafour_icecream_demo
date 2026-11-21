// Ghafour signature 3D scene: a branded paper cup with sculpted scoops.
// Loaded on demand (dynamic import) so three.js never blocks the menu or ordering.
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  CylinderGeometry,
  Color,
  DirectionalLight,
  DodecahedronGeometry,
  BackSide,
  DoubleSide,
  Group,
  HemisphereLight,
  InstancedMesh,
  LatheGeometry,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  RepeatWrapping,
  Scene,
  ShadowMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FLAVOR_LOOKS } from './flavors.js';

/* ───────────── small deterministic noise (no dependency) ───────────── */
function hash3(x, y, z) {
  let h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return h - Math.floor(h);
}
function smooth(t) {
  return t * t * (3 - 2 * t);
}
function valueNoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
  const lerp = MathUtils.lerp;
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf
  );
}
function fbm(x, y, z) {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < 4; i++) {
    s += a * (valueNoise(x * f, y * f, z * f) * 2 - 1);
    f *= 2.1;
    a *= 0.5;
  }
  return s;
}

/* ───────────── geometry builders ───────────── */
const CUP = { bottomR: 0.6, topR: 0.88, height: 1.22 };

/** A scooped ball: folded ridges from the scoop, a ruffled lip at its base, lumpy surface. */
function scoopGeometry(seed, radius, detail = 1) {
  // detail < 1 on phones: fewer vertices → faster flavour switches, same silhouette
  const geo = new SphereGeometry(radius, Math.round(160 * detail), Math.round(120 * detail));
  const pos = geo.attributes.position;
  const v = new Vector3();
  // direction the scoop was dragged — ridges run across it
  const drag = new Vector3(Math.cos(seed * 2.3), 0.35, Math.sin(seed * 2.3)).normalize();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const ang = Math.atan2(n.z, n.x);
    const warp = fbm(n.x * 1.6 + seed, n.y * 1.6, n.z * 1.6 - seed);
    let r = radius;
    // big, soft lumps
    r += radius * 0.09 * warp;
    // folded ridges left by the scoop (stronger on the upper half)
    const along = n.dot(drag) * 7 + warp * 2.4;
    const ridge = Math.pow(Math.abs(Math.sin(along)), 0.6) - 0.6;
    r += radius * 0.045 * ridge * MathUtils.smoothstep(n.y, -0.15, 0.4);
    // fine grain
    r += radius * 0.012 * fbm(n.x * 9 + seed, n.y * 9, n.z * 9);
    // ruffled lip just below the equator, irregular like a real scoop edge
    const lipY = -0.16 + 0.05 * Math.sin(ang * 2 + seed);
    const lip = Math.exp(-Math.pow((n.y - lipY) / 0.09, 2));
    const wave = 0.5 + 0.5 * Math.sin(ang * 9 + seed * 3 + warp * 3);
    r += radius * lip * (0.06 + 0.13 * wave);
    // tucked, flattened underside
    if (n.y < lipY - 0.05) r *= 1 - Math.min(0.45, (lipY - 0.05 - n.y) * 0.7);
    v.copy(n).multiplyScalar(r);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Icy micro-texture used as a bump map on every scoop. */
function grainCanvas() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#808080';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 0.6 + Math.random() * 2.2;
    const l = 90 + Math.random() * 120;
    g.fillStyle = `rgba(${l},${l},${l},0.55)`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

/* ───────────── canvas textures ───────────── */
function paperNoiseCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 200 + Math.random() * 55;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** The cup's printed wrap: cream paper, rose band, gold scallops, the real Ghafour seal. */
function cupLabelCanvas(logo) {
  const W = 2048, H = 560;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  // paper
  g.fillStyle = '#fff8ee';
  g.fillRect(0, 0, W, H);
  // rose band
  const bandTop = 150, bandBot = 430;
  g.fillStyle = '#f6c9d6';
  g.fillRect(0, bandTop, W, bandBot - bandTop);
  // gold scallops along both band edges (echoes the seal's scalloped border)
  g.fillStyle = '#c9a267';
  const sc = 26;
  for (let x = -sc; x < W + sc; x += sc * 2) {
    g.beginPath();
    g.arc(x + sc, bandTop, sc, Math.PI, 0);
    g.fill();
    g.beginPath();
    g.arc(x + sc, bandBot, sc, 0, Math.PI);
    g.fill();
  }
  // thin green rule
  g.fillStyle = '#25675d';
  g.fillRect(0, 36, W, 8);
  g.fillRect(0, H - 44, W, 8);
  // wordmark repeated around the cup
  g.fillStyle = '#25675d';
  g.font = 'italic 700 64px Fraunces, Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const x of [W * 0.15, W * 0.85]) {
    g.fillText('Ghafour', x, bandTop + 100);
    g.font = '700 30px Inter, Arial, sans-serif';
    g.fillText('ORIGINAL · 1919', x, bandTop + 170);
    g.font = 'italic 700 64px Fraunces, Georgia, serif';
  }
  // the real seal, centred at u = 0.5 (we turn the cup so it faces the camera)
  if (logo) {
    const cx = W / 2, cy = (bandTop + bandBot) / 2, r = 175;
    g.save();
    g.beginPath();
    g.arc(cx, cy, r + 12, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.clip();
    g.drawImage(logo, cx - r * 1.12, cy - r * 1.12, r * 2.24, r * 2.24);
    g.restore();
  }
  return c;
}

function waferCanvas() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#d9a35f';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#b07a3a';
  g.lineWidth = 7;
  for (let i = -256; i < 512; i += 32) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 256, 256);
    g.stroke();
    g.beginPath();
    g.moveTo(i + 256, 0);
    g.lineTo(i, 256);
    g.stroke();
  }
  return c;
}

function contactShadowCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(90,30,45,0.55)');
  grad.addColorStop(0.45, 'rgba(90,30,45,0.22)');
  grad.addColorStop(1, 'rgba(90,30,45,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return c;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* ───────────── the scene ───────────── */
/**
 * createCupScene(container, { logoUrl, flavor, mobile }) → { setFlavor, dispose }
 * Throws if WebGL is unavailable (caller shows the photo fallback).
 */
export async function createCupScene(container, { logoUrl, flavor, mobile = false, onFirstFrame }) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'gh-stage-canvas';

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.55;

  const camera = new PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 2.15, 7.4);
  camera.lookAt(0, 1.05, 0);

  // soft studio lighting
  scene.add(new HemisphereLight(0xfff6f0, 0xf2b8c6, 0.85));
  const key = new DirectionalLight(0xfff1e6, 2.1);
  key.position.set(-3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 16;
  key.shadow.camera.left = key.shadow.camera.bottom = -2.5;
  key.shadow.camera.right = key.shadow.camera.top = 2.5;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0008;
  scene.add(key);
  const rim = new DirectionalLight(0xffd9e4, 1.2);
  rim.position.set(3, 3, -4);
  scene.add(rim);

  // floor: soft shadow catcher + a darker contact shadow right under the cup
  const floor = new Mesh(new PlaneGeometry(8, 8), new ShadowMaterial({ color: 0x5a1e2d, opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const contactTex = new CanvasTexture(contactShadowCanvas());
  const contact = new Mesh(
    new PlaneGeometry(2.4, 2.4),
    new MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false })
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.002;
  scene.add(contact);

  const rig = new Group(); // rotated by the user's drag
  scene.add(rig);

  // ── the cup ──
  const logo = logoUrl ? await loadImage(logoUrl) : null;
  if (document.fonts && document.fonts.ready) {
    try {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]);
    } catch {
      /* fonts are optional */
    }
  }
  const labelTex = new CanvasTexture(cupLabelCanvas(logo));
  labelTex.colorSpace = SRGBColorSpace;
  labelTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const paperBump = new CanvasTexture(paperNoiseCanvas(256, 256));
  paperBump.wrapS = paperBump.wrapT = RepeatWrapping;
  paperBump.repeat.set(6, 2);

  const outerProfile = [];
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    outerProfile.push(new Vector2(MathUtils.lerp(CUP.bottomR, CUP.topR, t), t * CUP.height));
  }
  const outer = new Mesh(
    new LatheGeometry(outerProfile, 128),
    new MeshStandardMaterial({ map: labelTex, roughness: 0.78, metalness: 0, bumpMap: paperBump, bumpScale: 0.6 })
  );
  outer.castShadow = true;
  outer.receiveShadow = true;
  outer.rotation.y = Math.PI; // u = 0.5 (the seal) faces the camera
  rig.add(outer);

  const paper = new MeshStandardMaterial({ color: 0xfff3e6, roughness: 0.85, side: DoubleSide });
  const inner = new Mesh(
    new LatheGeometry(outerProfile.map((p) => new Vector2(p.x - 0.03, p.y)), 96),
    paper
  );
  inner.material = paper.clone();
  inner.material.side = BackSide; // inside wall
  rig.add(inner);
  const base = new Mesh(new CylinderGeometry(CUP.bottomR, CUP.bottomR, 0.02, 64), paper);
  base.position.y = 0.01;
  base.receiveShadow = true;
  rig.add(base);
  const lip = new Mesh(new TorusGeometry(CUP.topR - 0.005, 0.035, 16, 128), paper);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = CUP.height;
  lip.castShadow = true;
  rig.add(lip);

  // rolled wafer stick (a real Ghafour topping)
  const waferTex = new CanvasTexture(waferCanvas());
  waferTex.colorSpace = SRGBColorSpace;
  waferTex.wrapS = waferTex.wrapT = RepeatWrapping;
  waferTex.repeat.set(2, 3);
  const wafer = new Mesh(
    new CylinderGeometry(0.075, 0.075, 1.25, 32, 1, false),
    new MeshStandardMaterial({ map: waferTex, roughness: 0.7, bumpMap: waferTex, bumpScale: 1.2 })
  );
  wafer.castShadow = true;
  wafer.position.set(0.42, CUP.height + 0.75, -0.25);
  wafer.rotation.set(0.25, 0, -0.32);
  rig.add(wafer);

  // ── scoops ──
  const scoopGroup = new Group();
  rig.add(scoopGroup);
  const bitGeo = new DodecahedronGeometry(0.045, 0);
  const grainTex = new CanvasTexture(grainCanvas());
  grainTex.wrapS = grainTex.wrapT = RepeatWrapping;
  grainTex.repeat.set(3, 2);
  let current = null;

  function buildScoops(look) {
    const g = new Group();
    const layout =
      look.scoops.length === 1
        ? [[0, 1.48, 0.02, 0.74]]
        : look.scoops.length === 2
          ? [[-0.3, 1.42, 0.05, 0.6], [0.3, 1.46, -0.02, 0.6]]
          : [[-0.34, 1.38, 0.12, 0.54], [0.34, 1.4, 0.08, 0.54], [0, 1.86, -0.05, 0.52]];
    look.scoops.forEach((s, i) => {
      const [x, y, z, r] = layout[i];
      const mat = new MeshPhysicalMaterial({
        color: new Color(s.color),
        roughness: s.roughness ?? 0.6,
        sheen: 0.7,
        sheenRoughness: 0.6,
        sheenColor: new Color(s.sheen || '#ffffff'),
        clearcoat: s.clearcoat ?? 0.12,
        clearcoatRoughness: 0.5,
        bumpMap: grainTex,
        bumpScale: 1.4,
      });
      const m = new Mesh(scoopGeometry(i * 1.7 + look.seed, r, mobile ? 0.55 : 1), mat);
      m.position.set(x, y, z);
      m.rotation.y = i * 1.3 + look.seed;
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
      if (s.bits) addBits(m, r, s.bits);
    });
    return g;
  }

  function addBits(scoop, r, bits) {
    const mesh = new InstancedMesh(
      bitGeo,
      new MeshStandardMaterial({ color: new Color(bits.color), roughness: 0.8 }),
      bits.count
    );
    const m = new Matrix4();
    const q = new Quaternion();
    const p = new Vector3();
    const s = new Vector3();
    const dummy = new Object3D();
    for (let i = 0; i < bits.count; i++) {
      // points on the upper part of the scoop surface
      const u = Math.random() * Math.PI * 2;
      const yN = bits.top ? 0.35 + Math.random() * 0.65 : -0.1 + Math.random() * 1.1;
      const rr = Math.sqrt(Math.max(0, 1 - yN * yN));
      p.set(Math.cos(u) * rr, yN, Math.sin(u) * rr).multiplyScalar(r * (bits.depth ?? 1.0));
      dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      dummy.updateMatrix();
      q.copy(dummy.quaternion);
      const k = (bits.size || 1) * (0.6 + Math.random() * 0.8);
      s.set(k, k * (bits.flat ? 0.28 : 0.8), k * (bits.flat ? 0.8 : 1));
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.castShadow = false;
    scoop.add(mesh);
  }

  function disposeGroup(g) {
    g.traverse((o) => {
      if (o.geometry && o.geometry !== bitGeo) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }

  // pop animation between flavours
  let popT = 1;
  let pending = null;
  let currentSlug = null;
  function setFlavor(slug) {
    if (slug === currentSlug) return;
    currentSlug = slug;
    const look = FLAVOR_LOOKS[slug] || FLAVOR_LOOKS.arabic_mix;
    if (!current) {
      current = buildScoops(look);
      scoopGroup.add(current);
      return;
    }
    pending = look;
    popT = 0;
    invalidate();
  }
  setFlavor(flavor);

  // render-loop state (declared early: resize/drag handlers call invalidate())
  let raf = 0, onScreen = true, firstFrame = true, dirty = true, last = performance.now();

  // ── interaction: drag to turn (horizontal only) ──
  let targetRot = -0.35, rot = -0.35, dragging = false, lastX = 0;
  const onDown = (e) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    targetRot += (e.clientX - lastX) * 0.01;
    lastX = e.clientX;
    invalidate();
  };
  const onUp = () => {
    dragging = false;
    invalidate();
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  // ── sizing ──
  container.appendChild(canvas);
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    invalidate();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // ── render on demand: draw only while something changes (drag easing, flavour pop),
  //    and only while the stage is on screen and the tab is visible. Idle = 0 frames.
  function invalidate() {
    dirty = true;
    schedule();
  }
  const loop = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    rot += (targetRot - rot) * Math.min(1, dt * 8);
    if (Math.abs(targetRot - rot) < 0.0005) rot = targetRot;
    rig.rotation.y = rot;

    if (popT < 1) {
      popT = Math.min(1, popT + dt * 3.2);
      if (pending && popT >= 0.5) {
        scoopGroup.remove(current);
        disposeGroup(current);
        current = buildScoops(pending);
        scoopGroup.add(current);
        pending = null;
      }
      // shrink the old scoops, then grow the new ones with a small overshoot
      const scale =
        popT < 0.5
          ? 1 - Math.pow(popT * 2, 2)
          : (() => {
              const k = (popT - 0.5) * 2 - 1;
              return 1 + 2.2 * k * k * k + 1.2 * k * k; // easeOutBack
            })();
      current.scale.setScalar(Math.max(0.001, scale));
    }
    renderer.render(scene, camera);
    if (import.meta.env?.DEV) container.dataset.frames = String((Number(container.dataset.frames) || 0) + 1);
    if (firstFrame) {
      firstFrame = false;
      onFirstFrame?.();
    }
    // keep going only while something is still moving
    dirty = dragging || rot !== targetRot || popT < 1;
    if (dirty) schedule();
  };
  function schedule() {
    if (!raf && dirty && onScreen && document.visibilityState === 'visible') {
      raf = requestAnimationFrame((now) => {
        if (last < now - 100) last = now - 16; // resume without a big time jump
        loop(now);
      });
    }
  }
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen) schedule();
    else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  io.observe(container);
  const onVis = () => document.visibilityState === 'visible' && schedule();
  document.addEventListener('visibilitychange', onVis);
  schedule();

  return {
    setFlavor,
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      if (current) disposeGroup(current);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          for (const k of ['map', 'bumpMap']) o.material[k]?.dispose?.();
          o.material.dispose();
        }
      });
      grainTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    },
    canvas,
  };
}
