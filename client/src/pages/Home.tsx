import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlobePulse } from "@/components/GlobePulse";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.1 + vec2(1.3, 0.7);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  uv.x *= uResolution.x / uResolution.y;

  float t = uTime * 0.12;

  vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(1.0)));
  vec2 r = vec2(fbm(uv + 2.5 * q + vec2(1.7, 9.2) + 0.15 * t),
                fbm(uv + 2.5 * q + vec2(8.3, 2.8) + 0.126 * t));

  float f = fbm(uv + 2.8 * r);

  vec3 col = mix(
    vec3(0.04, 0.04, 0.05),
    vec3(0.10, 0.10, 0.12),
    clamp(f * f * 4.0, 0.0, 1.0)
  );
  col = mix(col, vec3(0.14, 0.14, 0.16), clamp(length(q), 0.0, 1.0));
  col = mix(col, vec3(0.20, 0.20, 0.24), clamp(length(r.x), 0.0, 1.0));

  float vignette = 1.0 - smoothstep(0.75, 1.55, length(vUv - 0.5) * 1.7);
  col *= vignette * 0.35 + 0.45;

  gl_FragColor = vec4(col, 1.0);
}
`;

const globeMarkers = [
  { id: "mexico", location: [23.63, -102.55] as [number, number], delay: 0 },
  {
    id: "massachusetts",
    location: [42.36, -71.06] as [number, number],
    delay: 0.5,
  },
  { id: "iceland", location: [64.96, -19.02] as [number, number], delay: 1 },
];

export function Home() {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });

    scene.add(new THREE.Mesh(geometry, material));

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      uniforms.uTime.value += 0.016;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (canvasRef.current?.contains(renderer.domElement)) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section className="relative min-h-screen w-screen overflow-hidden bg-[#09090B]">
      <div ref={canvasRef} className="absolute inset-0 z-0 h-full w-full" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 items-center gap-16 px-[6vw] py-12 md:grid-cols-2 md:py-0">
        <div className="flex justify-center md:justify-start">
          <div className="w-full max-w-[720px] text-center md:text-left">
            <h1 className="mb-4 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#E8E8E8] sm:text-5xl lg:text-6xl">
              Automate every channel
            </h1>

            <p className="mb-8 max-w-xl text-sm leading-relaxed text-[#909090] lg:text-base md:mx-0 mx-auto">
              Post turns one idea into platform-ready campaigns, then publishes,
              measures, and improves them across every channel automatically.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row md:justify-start justify-center">
              <Link to="/login">
                <Button>BEGIN GENERATING</Button>
              </Link>

              <Link to="/login">
                <Button variant="secondary">EXPLORE PLATFORM</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="relative hidden items-center justify-center overflow-hidden md:flex">
          <GlobePulse
            className="relative w-[138%] max-w-[980px] translate-x-[10%] opacity-45 blur-[0.8px]"
            markers={globeMarkers}
          />
        </div>
      </div>
    </section>
  );
}
