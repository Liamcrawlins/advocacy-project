// The essay on the box. Each section of the essay is printed on one side of the white box, and the last side holds
// the sources. The arrows (or a swipe, or the arrow keys) turn the box to the next side; a tap sets that side flat in
// the middle of the screen to read.
//
// The essay's words are read as they are from essay.txt and never changed: a short line with no closing punctuation
// starts a new section, and every other line is a paragraph of the section above it.
import * as THREE from 'three';
import { SOURCES } from './sources.js';

// ---------- the text ----------
const raw = await (await fetch('essay.txt', { cache: 'no-store' })).text();
const isHeading = line => line.trim().length > 0 && line.trim().length < 60 && !/[.!?”"’)]$/.test(line.trim());
const sections = [];
for (const line of raw.split(/\r?\n/)) {
  if (!line.trim()) continue;
  if (isHeading(line)) sections.push({ title: line.trim(), paragraphs: [] });
  else sections[sections.length - 1].paragraphs.push(line);
}
sections.push({ title: 'Sources', paragraphs: [], sources: true });
const N = sections.length;

// ---------- colours, from Pandora's Box ----------
const INK = '#24232a', INK2 = '#57534d', ORANGE = '#ff9636', STONE = '#fcf5e6', STONE_HI = '#fffbf3';   // cream, so the sides read like a page
// warm, neutral light, so the pink and blue of the room never tint the cream
const LIGHT = { sky: '#fffaf0', fill: '#fff4ea', ground: '#efe4cf' };

// ---------- three ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);

scene.add(new THREE.HemisphereLight(LIGHT.sky, LIGHT.ground, 1.85));
const sun = new THREE.DirectionalLight('#fffaf2', 1.25);
sun.position.set(2.5, 9, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 25 });
sun.shadow.radius = 6;
scene.add(sun);
const fill = new THREE.DirectionalLight(LIGHT.fill, .35); fill.position.set(-5, 1, 4); scene.add(fill);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ color: '#14474a', opacity: .16 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -2.35; ground.receiveShadow = true;
scene.add(ground);

// ---------- a side of the box: stone, with its section set in ink ----------
const TEX = 2048, PAD = 190;
function stoneGround(x) {
  const g = x.createLinearGradient(0, 0, 0, TEX); g.addColorStop(0, STONE_HI); g.addColorStop(1, STONE);
  x.fillStyle = g; x.fillRect(0, 0, TEX, TEX);
  // a fine mineral grain, as on the game's stone
  const rnd = mulberry(7);
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(80,70,60,${rnd() * .035})`; const s = 1 + rnd() * 3; x.fillRect(rnd() * TEX, rnd() * TEX, s, s); }
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function wrap(x, text, width) {
  const words = text.split(' '), lines = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > width && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}
const label = i => `${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
// Type as the game sets it (css/style.css): Inter throughout. The label is the game's kicker (500, tracked .14em,
// upper case), the heading its card heading (500, -.035em, 1.02 leading) and the body its card text (400, 1.55).
// Every word is cut into the stone as the game cuts its marks (render.js, label()): a faint light edge along the
// lower side of each letter, then the ink laid in with multiply, so the stone's grain shows through it.
const CUT_INK = '#2a2930', CUT_INK2 = '#5d5952';
function cut(x, size, color, draw) {
  const off = Math.max(1.5, size * .022);
  x.save(); x.translate(0, off); x.globalAlpha = .8; x.fillStyle = x.strokeStyle = '#ffffff'; draw(); x.restore();
  x.save(); x.globalCompositeOperation = 'multiply'; x.fillStyle = x.strokeStyle = color; draw(); x.restore();
}
const type = (x, weight, size, track = 0, style = '') => { x.font = `${style} ${weight} ${size}px Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif`; x.letterSpacing = track * size + 'px'; };
function drawSide(i) {
  const s = sections[i], cv = document.createElement('canvas'); cv.width = cv.height = TEX;
  const x = cv.getContext('2d'); stoneGround(x);
  x.textBaseline = 'alphabetic'; x.lineCap = 'square';
  const W = TEX - PAD * 2;
  // a fine carved frame set in from the edge, so the text sits in a panel of the stone
  const F = 92;
  cut(x, 60, 'rgba(60,52,44,.28)', () => { x.lineWidth = 3; x.strokeRect(F, F, TEX - 2 * F, TEX - 2 * F); });
  // the label
  type(x, 500, 34, .14);
  cut(x, 34, CUT_INK2, () => x.fillText(label(i).toUpperCase(), PAD, PAD + 34));
  // the heading
  const HS = 112; type(x, 500, HS, -.035);
  const head = wrap(x, s.title, W); let y = PAD + 34 + 70 + HS * .78;
  head.forEach(l => { const yy = y; cut(x, HS, CUT_INK, () => x.fillText(l, PAD, yy)); y += HS * 1.02; });
  // a short carved rule under it
  y += 18;
  cut(x, 60, 'rgba(60,52,44,.45)', () => x.fillRect(PAD, y, 132, 4));
  y += 70;
  // the body, set as large as the side allows
  const items = s.sources ? (SOURCES.length ? SOURCES : null) : s.paragraphs;
  if (!items) {
    type(x, 400, 54, 0, 'italic');
    cut(x, 54, CUT_INK2, () => x.fillText('Sources to come.', PAD, y + 54));
  } else {
    const room = TEX - PAD - y + 20, LH = 1.55, GAP = .8;
    let px = 64, lines;
    for (; px > 20; px -= 1) {
      type(x, 400, px);
      lines = items.map(p => wrap(x, p, W));
      const h = lines.reduce((a, l) => a + l.length * px * LH, 0) + (lines.length - 1) * px * GAP;
      if (h <= room) break;
    }
    y += px;
    lines.forEach(ls => { ls.forEach(l => { const yy = y; cut(x, px, CUT_INK, () => x.fillText(l, PAD, yy)); y += px * LH; }); y += px * GAP; });
  }
  x.letterSpacing = '0px';
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

// BoxGeometry's sides, in its own order: +x, -x, +y, -y, +z, -z. For each: its outward normal and which way is up
// on the picture printed on it.
const FACE = [
  { n: [1, 0, 0], up: [0, 1, 0] }, { n: [-1, 0, 0], up: [0, 1, 0] },
  { n: [0, 1, 0], up: [0, 0, -1] }, { n: [0, -1, 0], up: [0, 0, 1] },
  { n: [0, 0, 1], up: [0, 1, 0] }, { n: [0, 0, -1], up: [0, 1, 0] },
];
// the order the sections go round the box: front, right, back, left, top, and the sources underneath
const SIDE_OF = [4, 0, 5, 1, 2, 3];

await Promise.all([document.fonts.load('500 92px Inter'), document.fonts.load('400 60px Inter'), document.fonts.load('500 34px Inter'), document.fonts.load('italic 400 52px Inter')]);
const mats = FACE.map(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .82, metalness: 0 }));
sections.forEach((_, i) => { mats[SIDE_OF[i]].map = drawSide(i); });
const SIZE = 3;
const box = new THREE.Mesh(new THREE.BoxGeometry(SIZE, SIZE, SIZE), mats);
box.castShadow = true;
const float = new THREE.Group(); float.add(box); scene.add(float);

// the turn that brings section i to the front, upright; then a three-quarter tilt so it reads as a box
const TILT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -.48, 0));
function facing(i) {
  const f = FACE[SIDE_OF[i]], n = new THREE.Vector3(...f.n), u = new THREE.Vector3(...f.up), r = new THREE.Vector3().crossVectors(u, n);
  const m = new THREE.Matrix4().set(r.x, r.y, r.z, 0, u.x, u.y, u.z, 0, n.x, n.y, n.z, 0, 0, 0, 0, 1);
  return new THREE.Quaternion().setFromRotationMatrix(m);
}
const BASE = sections.map((_, i) => facing(i));

// ---------- state ----------
let cur = 0, reading = false;
const turn = { from: BASE[0].clone().premultiply(TILT), to: BASE[0].clone().premultiply(TILT), t: 1, dur: .95 };
let tilt = 1, tiltTo = 1;          // 1 at rest, 0 when the side is set flat for reading
let zoom = 0, zoomTo = 0;          // 0 at rest, 1 reading
box.quaternion.copy(turn.to);

const $ = id => document.getElementById(id);
const dots = $('dots');
sections.forEach(() => dots.appendChild(document.createElement('li')));

function show(i) {
  $('wNum').textContent = label(i);
  $('wName').textContent = sections[i].title;
  [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
  $('prev').disabled = i === 0;
  $('next').disabled = i === N - 1;
  $('prev').setAttribute('aria-label', i > 0 ? 'Previous section: ' + sections[i - 1].title : 'Previous section');
  $('next').setAttribute('aria-label', i < N - 1 ? 'Next section: ' + sections[i + 1].title : 'Next section');
  if (reading) fillReader(i);
}
function go(i, settle = false) {
  if (i < 0 || i >= N || (i === cur && !settle)) return;
  cur = i;
  turn.from = box.quaternion.clone(); turn.t = 0;
  show(i);
}
function fillReader(i) {
  const s = sections[i];
  $('rNum').textContent = label(i);
  $('rTitle').textContent = s.title;
  const body = $('rBody'); body.replaceChildren();
  if (s.sources) {
    if (SOURCES.length) { const ol = document.createElement('ol'); ol.className = 'sources'; SOURCES.forEach(t => { const li = document.createElement('li'); li.textContent = t; ol.appendChild(li); }); body.appendChild(ol); }
    else { const p = document.createElement('p'); p.className = 'empty'; p.textContent = 'Sources to come.'; body.appendChild(p); }
  } else s.paragraphs.forEach(t => { const p = document.createElement('p'); p.textContent = t; body.appendChild(p); });
  $('card').scrollTop = 0;
}
function openReader() {
  if (reading) return;
  reading = true; fillReader(cur);
  document.body.classList.add('reading');
  $('reader').classList.remove('hidden');
  tiltTo = 0; zoomTo = 1;
  setTimeout(() => $('card').focus({ preventScroll: true }), 50);
}
function closeReader() {
  if (!reading) return;
  reading = false;
  document.body.classList.remove('reading');
  $('reader').classList.add('hidden');
  tiltTo = 1; zoomTo = 0;
}

$('prev').addEventListener('click', () => go(cur - 1));
$('next').addEventListener('click', () => go(cur + 1));
$('rClose').addEventListener('click', closeReader);
$('reader').addEventListener('click', e => { if (e.target === $('reader')) closeReader(); });
addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') go(cur + 1);
  else if (e.key === 'ArrowLeft') go(cur - 1);
  else if (e.key === 'Escape') closeReader();
  else if ((e.key === 'Enter' || e.key === ' ') && !reading && document.activeElement === document.body) { e.preventDefault(); openReader(); }
});

// A tap on the box reads the side facing you. Dragging turns the box freely, any way at all; let go and it settles on
// whichever side is nearest the front, and that side becomes the section you are on.
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
const DRAG = .0085;                                      // radians per pixel dragged
const AXIS_X = new THREE.Vector3(1, 0, 0), AXIS_Y = new THREE.Vector3(0, 1, 0), spinQ = new THREE.Quaternion();
let drag = null;
canvas.addEventListener('pointerdown', e => {
  if (reading) return;
  drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, id: e.pointerId };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) { drag.moved = true; turn.t = 1; document.body.classList.add('dragging'); }
  if (!drag.moved) return;
  const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly; drag.lx = e.clientX; drag.ly = e.clientY;
  box.quaternion.premultiply(spinQ.setFromAxisAngle(AXIS_Y, dx * DRAG)).premultiply(spinQ.setFromAxisAngle(AXIS_X, dy * DRAG));
});
// the side whose face is turned most nearly to where a side rests at the front
const REST = new THREE.Vector3(0, 0, 1).applyQuaternion(TILT), nrm = new THREE.Vector3();
function nearest() {
  let best = cur, most = -2;
  sections.forEach((_, i) => { const d = nrm.set(...FACE[SIDE_OF[i]].n).applyQuaternion(box.quaternion).dot(REST); if (d > most) { most = d; best = i; } });
  return best;
}
function release(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const moved = drag.moved; drag = null;
  document.body.classList.remove('dragging');
  if (moved) { go(nearest(), true); return; }
  ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  if (ray.intersectObject(box).length) openReader();
}
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', e => { if (drag && drag.moved) release(e); else drag = null; });

// ---------- the cursor, as in Pandora's Box ----------
// with a mouse or trackpad: a small dot of ink that opens into a ring over a button or link, or over the box
// (the box is asked at most every 80ms)
if (matchMedia('(pointer: fine)').matches) {
  const c = $('cursor'); document.documentElement.classList.add('has-cursor'); let asked = 0, onBox = false;
  addEventListener('pointermove', e => {
    c.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`; c.classList.add('on');
    if (e.target === canvas && performance.now() - asked > 80) {
      asked = performance.now();
      ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      ray.setFromCamera(ptr, camera); onBox = !reading && ray.intersectObject(box).length > 0;
    } else if (e.target !== canvas) onBox = false;
    c.classList.toggle('ring', onBox || !!e.target.closest('button:not([disabled]), a, label, [role="button"]'));
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => c.classList.remove('on'));
}

// ---------- size: the box fits between the arrows, above the caption ----------
let dist = 14;
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const span = 4.5;                                       // the turned box's height and width on screen, in box units
  const fracH = .62, fracW = w < 560 ? .68 : .6;
  const needH = Math.max(span / fracH, span / (fracW * camera.aspect));
  dist = needH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
}
addEventListener('resize', resize); resize();

// ---------- run ----------
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock = new THREE.Clock();
const target = new THREE.Quaternion(), flat = new THREE.Quaternion();
show(0);
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), .05), now = clock.elapsedTime;
  tilt += (tiltTo - tilt) * Math.min(1, dt * 6);
  zoom += (zoomTo - zoom) * Math.min(1, dt * 6);
  // where the box is headed: the side for this section, tilted by however far from reading we are
  flat.identity().slerp(TILT, tilt);
  target.copy(BASE[cur]).premultiply(flat);
  if (drag && drag.moved) { /* the hand has it */ }
  else if (turn.t < 1) {
    turn.t = Math.min(1, turn.t + dt / (reduce ? .01 : turn.dur));
    box.quaternion.slerpQuaternions(turn.from, target, ease(turn.t));
  } else box.quaternion.copy(target);
  // a slow float while it waits
  const still = reduce ? 0 : 1 - zoom;
  float.position.y = Math.sin(now * .9) * .08 * still + .25 * (1 - zoom);
  float.rotation.y = Math.sin(now * .45) * .03 * (drag && drag.moved ? 0 : still);
  // drawing near to read: the box comes forward and sits behind the card
  camera.position.set(0, dist * .3 * (1 - zoom), dist * (1 - zoom * .22));
  camera.lookAt(0, .15 * (1 - zoom), 0);
  renderer.render(scene, camera);
});
