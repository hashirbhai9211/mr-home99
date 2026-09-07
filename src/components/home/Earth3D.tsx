"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";

export type EarthMarket = { id: number; slug: string; name: string; flag: string; latitude: number; longitude: number; featured?: boolean };

type Props = {
  markets: EarthMarket[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  onReady?: () => void;
  quality?: "high" | "low";
};

const DEG = Math.PI / 180;

export function latLngToVector3(lat: number, lng: number, r = 1) {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

const atmosVert = `varying vec3 vNormal; void main(){ vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const atmosFrag = `varying vec3 vNormal; void main(){ float i = pow(0.68 - dot(vNormal, vec3(0.0,0.0,1.0)), 3.2); gl_FragColor = vec4(0.42, 0.66, 1.0, 1.0) * i * 1.35; }`;

function dampAngle(current: number, target: number, lambda: number, dt: number) {
  let diff = target - current;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  return current + diff * (1 - Math.exp(-lambda * dt));
}

function Marker({ m, active, onSelect }: { m: EarthMarket; active: boolean; onSelect: (s: string) => void }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const pos = useMemo(() => latLngToVector3(m.latitude, m.longitude, 1.005), [m.latitude, m.longitude]);

  useEffect(() => {
    group.current?.lookAt(pos.clone().multiplyScalar(2));
  }, [pos]);

  useFrame(({ clock }) => {
    if (!ring.current) return;
    const t = (clock.getElapsedTime() % 1.8) / 1.8;
    const s = active ? 1 + t * 2.4 : 1;
    ring.current.scale.setScalar(s);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = active ? 0.85 * (1 - t) : 0;
  });

  useEffect(() => {
    document.body.style.cursor = hover ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hover]);

  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(m.slug); };
  const color = active ? "#5ee06a" : hover ? "#4fd35c" : "#3ec24a";

  return (
    <group ref={group} position={pos}>
      <mesh onClick={click} onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} onPointerOut={() => setHover(false)}>
        {/* Generous invisible hit target — finger-friendly on touch screens. */}
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <sphereGeometry args={[active ? 0.02 : 0.014, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <ringGeometry args={[0.02, 0.028, 32]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.9 : 0.5} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={ring} position={[0, 0, 0.003]}>
        <ringGeometry args={[0.028, 0.034, 32]} />
        <meshBasicMaterial color="#5ee06a" transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {(active || hover) && (
        <Html position={[0, 0.06, 0]} center distanceFactor={2.2} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <div className={`whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide backdrop-blur ${active ? "border-brand-bright/60 bg-brand/80 text-white shadow-glow" : "border-white/20 bg-black/60 text-white"}`}>
            {m.flag} {m.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Globe({ markets, selectedSlug, onSelect, onReady, quality }: Props & { quality: "high" | "low" }) {
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const { gl } = useThree();
  const dragging = useRef(false);
  const dragOffset = useRef(0);
  const lastX = useRef(0);
  const idle = useRef(0);

  const configure = useCallback(
    (loaded: THREE.Texture[]) => {
      const [day, spec, normal, lights, cloudTex] = loaded;
      day.colorSpace = THREE.SRGBColorSpace;
      lights.colorSpace = THREE.SRGBColorSpace;
      const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
      for (const t of loaded) t.anisotropy = aniso;
      onReady?.();
    },
    [gl, onReady],
  );
  const [day, spec, normal, lights, cloudTex] = useTexture(["/textures/earth_atmos_2048.jpg", "/textures/earth_specular_2048.jpg", "/textures/earth_normal_2048.jpg", "/textures/earth_lights_2048.png", "/textures/earth_clouds_1024.png"], configure);

  const segments = quality === "high" ? 96 : 48;
  // Keep the latest selection in a ref so useFrame can read it without
  // re-creating the render callback (avoids render-phase mutation lint errors).
  const selectedRef = useRef(selectedSlug);
  useEffect(() => {
    selectedRef.current = selectedSlug;
  }, [selectedSlug]);

  useEffect(() => {
    dragOffset.current = 0;
  }, [selectedSlug]);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const spinGroup = spin.current;
    const tiltGroup = tilt.current;
    if (!spinGroup || !tiltGroup) return;
    // Read the live selected market from the ref set during render (lint-safe).
    const active = selectedRef.current ? markets.find((m) => m.slug === selectedRef.current) ?? null : null;
    if (active && !dragging.current) {
      const targetY = -Math.PI / 2 - active.longitude * DEG + dragOffset.current;
      const targetX = THREE.MathUtils.clamp(active.latitude * DEG * 0.85, -0.9, 0.9);
      spinGroup.rotation.y = dampAngle(spinGroup.rotation.y, targetY, 3.2, d);
      tiltGroup.rotation.x = THREE.MathUtils.damp(tiltGroup.rotation.x, targetX, 3.2, d);
    } else if (!dragging.current) {
      idle.current += d;
      spinGroup.rotation.y += 0.06 * d;
      tiltGroup.rotation.x = THREE.MathUtils.damp(tiltGroup.rotation.x, 0.25, 2, d);
    }
    if (clouds.current) clouds.current.rotation.y += 0.012 * d;
    // Viewport-aware framing: derive camera distance from the actual FOV and canvas
    // aspect so the globe is always fully in frame (no cropping on phones, no
    // over-zoom when a market is focused).
    const cam = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / Math.max(state.size.height, 1);
    const narrow = aspect < 0.95 ? Math.min(0.95 / aspect, 1.5) : 1;
    // Narrow/portrait viewports: additionally pad the distance by the small
    // horizontal margin ratio. On phones the canvas is ~92vw × ~116vw tall, so
    // the globe is horizontally margin-bound; this keeps the limb + marker
    // labels (which extend past the limb) fully visible and the globe optically
    // centred instead of touching the frame edges.
    const xPad = aspect < 1 ? Math.min(1.09 / aspect, 1.28) : 1;
    const halfFov = (cam.fov * Math.PI) / 360;
    const fitZ = Math.max(1.2 / Math.tan(halfFov), 3.1) * narrow * xPad;
    const focusZ = Math.max(1.05 / Math.tan(halfFov), 2.75) * narrow * xPad;
    const targetZ = active ? focusZ : fitZ;
    cam.position.z = THREE.MathUtils.damp(cam.position.z, targetZ, 2.2, d);
    cam.lookAt(0, 0, 0);
  });

  const onDown = (e: ThreeEvent<PointerEvent>) => { dragging.current = true; lastX.current = e.clientX; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !spin.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    spin.current.rotation.y += dx * 0.005;
    dragOffset.current += dx * 0.005;
  };
  const onUp = () => { dragging.current = false; };

  return (
    <>
      <ambientLight intensity={0.28} />
      <directionalLight position={[5, 2.5, 4]} intensity={2.1} color="#fff6e8" />
      <directionalLight position={[-6, -2, -4]} intensity={0.18} color="#8fb4ff" />
      <Stars radius={40} depth={30} count={quality === "high" ? 2500 : 900} factor={3} saturation={0} fade speed={0.4} />
      <group ref={tilt}>
        <group ref={spin} rotation={[0, -Math.PI / 2 - 45 * DEG, 0]}>
          <mesh onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
            <sphereGeometry args={[1, segments, segments]} />
            <meshPhongMaterial map={day} specularMap={spec} normalMap={quality === "high" ? normal : undefined} normalScale={new THREE.Vector2(0.6, 0.6)} specular={new THREE.Color("#5c6f80")} shininess={14} emissiveMap={lights} emissive={new THREE.Color("#ffd9a0")} emissiveIntensity={0.22} />
          </mesh>
          {markets.map((m) => (
            <Marker key={m.slug} m={m} active={m.slug === selectedSlug} onSelect={onSelect} />
          ))}
        </group>
        <mesh ref={clouds} rotation={[0, -Math.PI / 2 - 45 * DEG, 0]} raycast={() => null}>
          <sphereGeometry args={[1.012, segments, segments]} />
          <meshLambertMaterial map={cloudTex} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      </group>
      <mesh scale={1.16} raycast={() => null}>
        <sphereGeometry args={[1, 48, 48]} />
        <shaderMaterial vertexShader={atmosVert} fragmentShader={atmosFrag} blending={THREE.AdditiveBlending} side={THREE.BackSide} transparent depthWrite={false} />
      </mesh>
      <mesh scale={1.004} raycast={() => null}>
        <sphereGeometry args={[1, 48, 48]} />
        <shaderMaterial
          vertexShader={atmosVert}
          fragmentShader={`varying vec3 vNormal; void main(){ float i = pow(1.0 - abs(dot(vNormal, vec3(0.0,0.0,1.0))), 3.5); gl_FragColor = vec4(0.45, 0.7, 1.0, 1.0) * i * 0.55; }`}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

export default function Earth3D(props: Props) {
  const quality = props.quality ?? "high";
  // Battery saver: pause the render loop when the canvas is off-screen or the
  // tab is hidden; resume automatically when it comes back into view.
  const holder = useRef<HTMLDivElement>(null);
  const inViewRef = useRef(true);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    const el = holder.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let visible = typeof document !== "undefined" ? !document.hidden : true;
    const update = () => setRunning(visible && inViewRef.current);
    const io = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry?.isIntersecting ?? true;
      update();
    }, { rootMargin: "120px" });
    io.observe(el);
    const onVis = () => {
      visible = !document.hidden;
      update();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return (
    <div ref={holder} className="h-full w-full">
      <Canvas
        dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
        camera={{ position: [0, 0, 3.1], fov: 40, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        className="!touch-pan-y"
        frameloop={running ? "always" : "never"}
      >
        <Suspense fallback={null}>
          <Globe {...props} quality={quality} />
        </Suspense>
      </Canvas>
    </div>
  );
}
