"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

// The hero avatar: a floating armoured figure wrapped in blue fabric, built from four
// layers that share one 1191 × 1496 canvas (40 px of empty padding on every side, so the
// waving cloth never gets clipped). Back to front: cloth-back, cloth-mid, body, cloth-front.
//
// The body stays still. Each cloth layer ripples in a WebGL shader: the ripple starts at
// zero where the cloth meets the body (the anchor) and grows towards the free ends, so the
// seams never move. Without WebGL, before the textures load, and under reduced motion the
// plain stacked images show instead. The canvas pauses while off screen.
//
// Keeps the image's aspect ratio, so give it a height or a width via className.

const W = 1191;
const H = 1496;

type Layer = {
  src: string;
  /** Where the cloth is attached, in image pixels */
  anchor: [number, number];
  /** Ripple strength is 0 inside the first radius and full beyond the second */
  radius: [number, number];
  /** Largest displacement, in image pixels (0 = still) */
  amp: number;
  phase: number;
  /** Layer opacity, 0 to 1 (default 1) */
  opacity?: number;
};

// The front and back cloth both hold the same right-hand tip, so they share one wave
// (same anchor, radius, strength and timing); separate waves would split that tip in two.
// The upper-right cloth (cloth-mid) is see-through, so the title shows through it.
const FRONT_BACK_WAVE = { anchor: [600, 660], radius: [80, 520], amp: 14, phase: 0 } satisfies Omit<Layer, "src">;

const LAYERS: Layer[] = [
  { src: "/images/hero-avatar/cloth-back.webp", ...FRONT_BACK_WAVE },
  { src: "/images/hero-avatar/cloth-mid.webp", anchor: [530, 250], radius: [40, 480], amp: 13, phase: 2.1, opacity: 0.8 },
  { src: "/images/hero-avatar/body.webp", anchor: [0, 0], radius: [0, 1], amp: 0, phase: 0 },
  { src: "/images/hero-avatar/cloth-front.webp", ...FRONT_BACK_WAVE },
];

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_size;
uniform vec2 u_anchor;
uniform vec2 u_radius;
uniform float u_amp;
uniform float u_time;
uniform float u_phase;
uniform float u_alpha;
void main() {
  vec2 p = v_uv * u_size;
  if (u_amp <= 0.0) { gl_FragColor = texture2D(u_tex, v_uv) * u_alpha; return; }
  vec2 d = p - u_anchor;
  float dist = length(d);
  float w = smoothstep(u_radius.x, u_radius.y, dist);
  vec2 dir = dist > 0.0 ? d / dist : vec2(0.0);
  vec2 perp = vec2(-dir.y, dir.x);
  float t = u_time;
  // Waves travel outward from the anchor, like fabric flapping in a current
  float flap = sin(dist * 0.013 - t * 1.6 + u_phase) + 0.4 * sin(dist * 0.031 - t * 2.5 + u_phase * 1.7);
  float stretch = sin(dist * 0.019 - t * 1.15 + u_phase * 0.5);
  float drift = sin(p.x * 0.008 + p.y * 0.005 - t * 1.05 + u_phase);
  vec2 off = w * u_amp * (perp * flap + dir * 0.35 * stretch + vec2(0.15, 0.3) * drift);
  vec4 c = texture2D(u_tex, (p - off) / u_size);
  // Folds catch the light as they turn
  c.rgb = min(c.rgb * (1.0 + 0.14 * w * flap), vec3(c.a));
  gl_FragColor = c * u_alpha;
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

type HeroAvatarProps = { className?: string; priority?: boolean };

export default function HeroAvatar({ className, priority = false }: HeroAvatarProps) {
  const root = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const box = root.current;
    const canvas = canvasRef.current;
    if (reduced || !box || !canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    let disposed = false;
    let frame = 0;
    let visible = true;
    let textures: WebGLTexture[] = [];
    const start = performance.now();

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      size: gl.getUniformLocation(program, "u_size"),
      anchor: gl.getUniformLocation(program, "u_anchor"),
      radius: gl.getUniformLocation(program, "u_radius"),
      amp: gl.getUniformLocation(program, "u_amp"),
      time: gl.getUniformLocation(program, "u_time"),
      phase: gl.getUniformLocation(program, "u_phase"),
      alpha: gl.getUniformLocation(program, "u_alpha"),
    };
    gl.uniform2f(u.size, W, H);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = () => {
      frame = 0;
      if (disposed || !visible) return;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u.time, (performance.now() - start) / 1000);
      LAYERS.forEach((layer, i) => {
        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.uniform2f(u.anchor, layer.anchor[0], layer.anchor[1]);
        gl.uniform2f(u.radius, layer.radius[0], layer.radius[1]);
        gl.uniform1f(u.amp, layer.amp);
        gl.uniform1f(u.phase, layer.phase);
        gl.uniform1f(u.alpha, layer.opacity ?? 1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      });
      box.dataset.live = "true";
      frame = requestAnimationFrame(draw);
    };

    const play = () => {
      if (!frame && textures.length) frame = requestAnimationFrame(draw);
    };

    const resizer = new ResizeObserver(resize);
    resizer.observe(canvas);
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
    });
    watcher.observe(box);

    const onLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      disposed = true;
      delete box.dataset.live;
    };
    canvas.addEventListener("webglcontextlost", onLost);

    Promise.all(LAYERS.map((layer) => loadImage(layer.src)))
      .then((images) => {
        if (disposed) return;
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        textures = images.map((img) => {
          const tex = gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          return tex;
        });
        resize();
        play();
      })
      .catch(() => {
        // The static images stay in place
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizer.disconnect();
      watcher.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      delete box.dataset.live;
      textures.forEach((tex) => gl.deleteTexture(tex));
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [reduced]);

  return (
    <div
      ref={root}
      role="img"
      aria-label="An armoured figure floating with arms open, wrapped in flowing blue fabric"
      className={cn("group relative aspect-[1191/1496]", className)}
    >
      <div
        aria-hidden="true"
        className="fig-glow pointer-events-none absolute left-[30%] top-[3%] h-[28%] w-[42%] rounded-full bg-[radial-gradient(closest-side,rgba(90,190,255,0.3),rgba(30,120,230,0.12)_55%,transparent)] blur-2xl"
      />
      <div className="absolute inset-0 group-data-[live=true]:invisible">
        {LAYERS.map((layer) => (
          <Image
            key={layer.src}
            src={layer.src}
            alt=""
            fill
            unoptimized
            priority={priority}
            draggable={false}
            style={{ opacity: layer.opacity ?? 1 }}
            className="select-none object-contain"
          />
        ))}
      </div>
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full opacity-0 group-data-[live=true]:opacity-100" />
    </div>
  );
}
