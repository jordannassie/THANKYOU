"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

const THETA = 0.35;
const GLOBE_NDC_RADIUS = 0.8;

const EMOJI_URL =
  "https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/Thankyou/Emojithank.png";

const MARKERS = [
  { lat: 32.7767, lon: -96.797 },
  { lat: 40.7128, lon: -74.006 },
  { lat: 34.0522, lon: -118.2437 },
  { lat: 19.4326, lon: -99.1332 },
  { lat: -23.5505, lon: -46.6333 },
  { lat: -34.6037, lon: -58.3816 },
  { lat: 51.5074, lon: -0.1278 },
  { lat: 48.8566, lon: 2.3522 },
  { lat: 6.5244, lon: 3.3792 },
  { lat: -26.2041, lon: 28.0473 },
  { lat: -1.2921, lon: 36.8219 },
  { lat: 25.2048, lon: 55.2708 },
  { lat: 19.076, lon: 72.8777 },
  { lat: 1.3521, lon: 103.8198 },
  { lat: 22.3193, lon: 114.1694 },
  { lat: 35.6762, lon: 139.6503 },
  { lat: -33.8688, lon: 151.2093 },
  { lat: 43.6532, lon: -79.3832 },
];

const BUBBLES = [
  { text: "Thank You, God!", className: "top-[6%] left-[2%] sm:left-[6%] md:left-[4%]", delay: "0s", duration: "16s", hideOnMobile: false },
  { text: "I'm thankful for today.", className: "top-[10%] right-[2%] sm:right-[6%] md:right-[2%]", delay: "2.4s", duration: "18s", hideOnMobile: false },
  { text: "Thank You for my family.", className: "top-[46%] left-0 md:left-[0%]", delay: "4.8s", duration: "17s", hideOnMobile: true },
  { text: "God is good!", className: "top-[42%] right-0 md:right-[0%]", delay: "1.2s", duration: "15s", hideOnMobile: false },
  { text: "Thank You for my future.", className: "bottom-[8%] left-1/2 -translate-x-1/2", delay: "3.6s", duration: "19s", hideOnMobile: true },
];

function project(
  lat: number,
  lon: number,
  phi: number,
  cssW: number
): { x: number; y: number; visible: boolean; opacity: number } {
  const latR = (lat * Math.PI) / 180;
  const lonR = (lon * Math.PI) / 180;

  const px = Math.cos(latR) * Math.cos(lonR);
  const py = Math.sin(latR);
  const pz = -Math.cos(latR) * Math.sin(lonR);

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosT = Math.cos(THETA);
  const sinT = Math.sin(THETA);

  const sx = cosPhi * px + sinPhi * pz;
  const sy = sinPhi * sinT * px + cosT * py - cosPhi * sinT * pz;
  const sz = -sinPhi * cosT * px + sinT * py + cosPhi * cosT * pz;

  const r = GLOBE_NDC_RADIUS * (cssW / 2);

  return {
    x: cssW / 2 + sx * r,
    y: cssW / 2 - sy * r,
    visible: sz > 0.04,
    opacity: Math.max(0, Math.min(1, (sz + 0.04) / 0.22)),
  };
}

const DALLAS_LON_RAD = (-96.797 * Math.PI) / 180;
const INITIAL_PHI = -(DALLAS_LON_RAD + Math.PI / 2);

export default function Globe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markerRefs = useRef<(HTMLImageElement | null)[]>([]);
  const phiRef = useRef(INITIAL_PHI);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let cssW = containerRef.current.offsetWidth || 560;

    const onResize = () => {
      if (containerRef.current) cssW = containerRef.current.offsetWidth;
    };
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: cssW * 2,
      height: cssW * 2,
      phi: phiRef.current,
      theta: THETA,
      dark: 1,
      diffuse: 1.5,
      mapSamples: 24000,
      mapBrightness: 3.6,
      baseColor: [0.1, 0.1, 0.18],
      markerColor: [1, 1, 1],
      glowColor: [0.18, 0.28, 0.7],
      markers: [],
    });

    let animId: number;

    function animate() {
      phiRef.current += 0.0032;
      globe.update({ phi: phiRef.current, width: cssW * 2, height: cssW * 2 });

      MARKERS.forEach((marker, i) => {
        const el = markerRefs.current[i];
        if (!el) return;
        const p = project(marker.lat, marker.lon, phiRef.current, cssW);
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        el.style.opacity = p.visible ? String(p.opacity.toFixed(3)) : "0";
        el.style.visibility = p.visible ? "visible" : "hidden";
      });

      animId = requestAnimationFrame(animate);
    }
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="relative w-full max-w-[720px] mx-auto aspect-square">
      <div
        ref={containerRef}
        className="absolute inset-[8%] sm:inset-[6%] md:inset-[4%]"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ contain: "layout paint size" }}
        />

        {MARKERS.map((marker, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${marker.lat}-${marker.lon}`}
            ref={(el) => {
              markerRefs.current[i] = el;
            }}
            src={EMOJI_URL}
            alt=""
            className="absolute pointer-events-none w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 object-contain drop-shadow-[0_0_8px_rgba(253,201,43,0.45)]"
            style={{
              visibility: "hidden",
              opacity: 0,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      {BUBBLES.map((bubble) => (
        <div
          key={bubble.text}
          className={`pointer-events-none absolute z-10 ${bubble.className} ${
            bubble.hideOnMobile ? "hidden md:block" : ""
          }`}
        >
          <div
            className="globe-bubble max-w-[160px] sm:max-w-[200px] rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2 sm:px-4 sm:py-2.5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
            style={{
              animationDelay: bubble.delay,
              animationDuration: bubble.duration,
            }}
          >
            <p className="text-[11px] sm:text-[13px] leading-snug text-white/90 font-medium tracking-wide">
              {bubble.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
