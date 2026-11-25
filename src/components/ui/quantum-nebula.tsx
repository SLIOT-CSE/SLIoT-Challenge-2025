"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// A cosmic backdrop: tens of thousands of fine cyan particles flowing through a swirling
// force field. Particles pile up along the field's currents into glowing strands, and where
// they overlap (additive blending) the cloud brightens into a core. Adapted from the
// "quantum nebula" scene and rebuilt for a background:
// - the simulation runs on flat typed arrays with no per-frame allocation;
// - six sines per particle come from a lookup table; phones step the flow every other frame;
// - it is pre-flowed in small slices before it fades in, so the strands already exist and
//   the page never stalls;
// - a wide volume, so the cloud spreads across the whole hero;
// - no bloom pass and no mouse repulsion (too costly / too distracting for a backdrop), only
//   gentle camera parallax on devices with a fine pointer;
// - pauses while off screen; under reduced motion it draws one still frame.
// Sits in an absolutely positioned box; give it size and opacity via className.

const config = {
  /** Particle counts for small and large screens */
  count: { small: 5000, large: 11000 },
  /** Half sizes of the volume the particles live in (wide, so it spreads across the hero) */
  bounds: { x: 7.5, y: 4.2, z: 3 },
  /** Cyan, matching the site's palette */
  hue: { base: 192, variance: 20 },
  /** Point size before depth scaling (fine dust: about 1 px, a little larger up close) */
  size: 0.6,
  /** Overall brightness, 0 to 1 */
  intensity: 0.85,
  flow: {
    /** How fast the field itself changes */
    speed: 0.03,
    /** Size of the swirls (smaller = larger structures) */
    scale: 0.75,
    /** Push from the field per frame at 60 fps */
    force: 0.0002,
    friction: 0.95,
    /** Share of particles sent back to a random spot each frame, so the strands keep
     *  re-forming instead of collapsing into a few thin lines */
    respawn: 1 / 2000,
  },
  /** Pre-flow before the fade-in, so the strands have formed: steps × frames per step. It
   *  runs in slices of `budgetMs` per frame, so it never blocks the page */
  warmup: { steps: 180, stride: 8, budgetMs: 6 },
  /** Small screens update the flow every other frame (the drift is slow, so it still reads smooth) */
  smallStepEvery: 2,
  parallax: 0.3,
  maxPixelRatio: 1.5,
};

// Sine lookup table: the flow needs six sines per particle per frame, and the table is about
// four times faster than Math.sin at an error of ~0.002, far below a pixel
const SIN_SIZE = 4096;
const SIN_MASK = SIN_SIZE - 1;
const SIN_K = SIN_SIZE / (Math.PI * 2);
const SIN_TABLE = new Float32Array(SIN_SIZE).map((_, i) => Math.sin(i / SIN_K));
const HALF_PI = Math.PI / 2;
const fsin = (x: number) => SIN_TABLE[((x * SIN_K) | 0) & SIN_MASK];

const VERTEX = /* glsl */ `
uniform float u_size;
uniform float u_pixelRatio;
attribute vec3 a_color;
varying vec3 v_color;
varying float v_fade;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float depth = -mv.z;
  gl_PointSize = max(1.0, u_size * u_pixelRatio * (10.0 / max(depth, 0.5)));
  gl_Position = projectionMatrix * mv;
  // Fade the particles closest to the camera so none blow up into big dots
  v_fade = smoothstep(0.6, 2.0, depth);
  v_color = a_color;
}`;

const FRAGMENT = /* glsl */ `
uniform float u_intensity;
varying vec3 v_color;
varying float v_fade;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(v_color, v_fade * u_intensity);
}`;

type QuantumNebulaProps = { className?: string };

export default function QuantumNebula({ className }: QuantumNebulaProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const large = window.matchMedia("(min-width: 768px)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      return; // No WebGL: the rest of the backdrop carries the hero
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, config.maxPixelRatio);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 2.4s ease-out";
    canvas.setAttribute("aria-hidden", "true");
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 50);
    camera.position.z = 5;

    // --- Particles ---
    const count = large ? config.count.large : config.count.small;
    const { x: bx, y: by, z: bz } = config.bounds;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() * 2 - 1) * bx;
      positions[i3 + 1] = (Math.random() * 2 - 1) * by;
      positions[i3 + 2] = (Math.random() * 2 - 1) * bz;
      const hue = (config.hue.base + (Math.random() - 0.5) * config.hue.variance) / 360;
      color.setHSL(hue, 1, 0.6 + Math.random() * 0.15);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    const positionAttr = new THREE.BufferAttribute(positions, 3);
    positionAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", positionAttr);
    geometry.setAttribute("a_color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_size: { value: config.size },
        u_pixelRatio: { value: pixelRatio },
        u_intensity: { value: config.intensity },
      },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // --- Flow simulation ---
    // Each particle is pushed along a swirling field, slowed by friction, and mirrored back in
    // at the edges. The field is the original scene's swirl (each axis driven by another
    // axis) plus a term that squeezes particles together, so they gather along its currents
    // into wisps and bright strands. A trickle of particles respawns at random spots so the
    // strands keep re-forming.
    const { speed, scale, force, friction, respawn } = config.flow;
    const step = (t: number, dt: number) => {
      const push = force * dt;
      const drag = Math.pow(friction, dt);
      const ts = t * speed;
      const recycle = respawn * dt;
      for (let i3 = 0; i3 < count * 3; i3 += 3) {
        if (Math.random() < recycle) {
          positions[i3] = (Math.random() * 2 - 1) * bx;
          positions[i3 + 1] = (Math.random() * 2 - 1) * by;
          positions[i3 + 2] = (Math.random() * 2 - 1) * bz;
          velocities[i3] = velocities[i3 + 1] = velocities[i3 + 2] = 0;
          continue;
        }
        const x = positions[i3];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];
        let fx = fsin(y * scale + ts) + 0.7 * fsin(x * scale * 1.3 + ts);
        let fy = fsin(z * scale + ts + HALF_PI) + 0.7 * fsin(y * scale * 1.7 - ts);
        let fz = fsin(x * scale + ts) + 0.5 * fsin(z * scale * 1.2 + ts + HALF_PI);
        const len = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
        fx /= len;
        fy /= len;
        fz /= len;
        const vx = (velocities[i3] + fx * push) * drag;
        const vy = (velocities[i3 + 1] + fy * push) * drag;
        const vz = (velocities[i3 + 2] + fz * push) * drag;
        velocities[i3] = vx;
        velocities[i3 + 1] = vy;
        velocities[i3 + 2] = vz;
        let nx = x + vx * dt;
        let ny = y + vy * dt;
        let nz = z + vz * dt;
        if (nx > bx || nx < -bx) nx = -nx;
        if (ny > by || ny < -by) ny = -ny;
        if (nz > bz || nz < -bz) nz = -nz;
        positions[i3] = nx;
        positions[i3 + 1] = ny;
        positions[i3 + 2] = nz;
      }
      positionAttr.needsUpdate = true;
    };

    let time = 0;

    const resize = () => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (warm && (reduced || !frame)) render();
    };

    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const render = () => {
      camera.position.x += (pointer.x * config.parallax - camera.position.x) * 0.03;
      camera.position.y += (-pointer.y * config.parallax - camera.position.y) * 0.03;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };

    // Scene time only advances while frames are drawn, so the flow carries on smoothly after
    // a pause (off screen, hidden tab) instead of jumping
    let frame = 0;
    let visible = true;
    let warm = false;
    let last = 0;
    let pending = 0; // frames of flow not yet simulated (small screens step every other frame)
    let tick = 0;
    const stepEvery = large ? 1 : config.smallStepEvery;
    const loop = (now: number) => {
      frame = 0;
      if (!visible) return;
      const dtMs = Math.min(now - last, 50);
      last = now;
      time += dtMs / 1000;
      pending += dtMs / (1000 / 60);
      if (++tick % stepEvery === 0) {
        step(time, pending);
        pending = 0;
      }
      render();
      frame = requestAnimationFrame(loop);
    };
    const play = () => {
      if (frame || reduced || !warm) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };

    // Pre-flow in small slices, so the strands exist before the fade-in without blocking the page
    let warmed = 0;
    let warmFrame = 0;
    const warmUp = () => {
      warmFrame = 0;
      const until = performance.now() + config.warmup.budgetMs;
      while (warmed < config.warmup.steps && performance.now() < until) {
        time += config.warmup.stride / 60;
        step(time, config.warmup.stride);
        warmed++;
      }
      if (warmed < config.warmup.steps) {
        warmFrame = requestAnimationFrame(warmUp);
        return;
      }
      warm = true;
      render();
      canvas.style.opacity = "1";
      play();
    };
    warmFrame = requestAnimationFrame(warmUp);

    const resizer = new ResizeObserver(resize);
    resizer.observe(mount);
    resize();

    let watcher: IntersectionObserver | null = null;
    if (!reduced) {
      watcher = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) play();
      });
      watcher.observe(mount);
      if (finePointer) window.addEventListener("pointermove", onPointer, { passive: true });
    }
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(warmFrame);
      resizer.disconnect();
      watcher?.disconnect();
      window.removeEventListener("pointermove", onPointer);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div ref={mountRef} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} />;
}
