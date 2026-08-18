"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

const THETA = 0.35; // fixed globe tilt

const CITIES = [
  { name: "Dallas, TX",     lat: 32.7767,  lon: -96.797  },
  { name: "London, UK",     lat: 51.5074,  lon:  -0.1278 },
  { name: "Dubai, UAE",     lat: 25.2048,  lon:  55.2708 },
  { name: "Hong Kong",      lat: 22.3193,  lon: 114.1694 },
  { name: "Johannesburg",   lat: -26.2041, lon:  28.0473 },
];

/**
 * Project a lat/lon to canvas-CSS pixel coords given the current phi.
 * Returns visible=true only when the point faces the camera (z3 > 0).
 */
function project(
  lat: number,
  lon: number,
  phi: number,
  cssSize: number
): { x: number; y: number; visible: boolean; opacity: number } {
  const latR = (lat * Math.PI) / 180;
  const lonR = (lon * Math.PI) / 180;

  // Globe-local cartesian
  const px = Math.cos(latR) * Math.cos(lonR);
  const py = Math.sin(latR);
  const pz = Math.cos(latR) * Math.sin(lonR);

  // Rotate around Y by phi (globe rotation)
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const px2 = px * cosPhi + pz * sinPhi;
  const py2 = py;
  const pz2 = -px * sinPhi + pz * cosPhi;

  // Rotate around X by -THETA (globe tilt)
  const cosT = Math.cos(-THETA);
  const sinT = Math.sin(-THETA);
  const py3 = py2 * cosT - pz2 * sinT;
  const pz3 = py2 * sinT + pz2 * cosT;

  const r = cssSize / 2;
  return {
    x: cssSize / 2 + px2 * r * 0.96,
    y: cssSize / 2 - py3 * r * 0.96,
    visible: pz3 > -0.05,
    opacity: Math.max(0, Math.min(1, (pz3 + 0.08) / 0.18)),
  };
}

export default function Globe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  // One ref per label div — direct DOM mutation avoids React re-renders
  const labelRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const phiRef       = useRef(0);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let cssW = containerRef.current.offsetWidth || 400;

    const onResize = () => {
      if (containerRef.current) cssW = containerRef.current.offsetWidth;
    };
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width:  cssW * 2,
      height: cssW * 2,
      phi:    phiRef.current,
      theta:  THETA,
      dark:       1,
      diffuse:    1.4,
      mapSamples: 20000,
      mapBrightness: 3.5,
      baseColor:   [0.1,  0.1,  0.18],
      markerColor: [1,    1,    1   ],
      glowColor:   [0.15, 0.25, 0.6 ],
      markers: CITIES.map((c) => ({ location: [c.lat, c.lon] as [number,number], size: 0.06 })),
    });

    let animId: number;

    function animate() {
      phiRef.current += 0.004; // continuous slow rotation
      globe.update({ phi: phiRef.current, width: cssW * 2, height: cssW * 2 });

      // Directly update label DOM elements — no React re-render needed
      CITIES.forEach((city, i) => {
        const el = labelRefs.current[i];
        if (!el) return;
        const p = project(city.lat, city.lon, phiRef.current, cssW);
        el.style.left    = `${p.x}px`;
        el.style.top     = `${p.y}px`;
        el.style.opacity = String(p.opacity);
        el.style.display = p.visible ? "block" : "none";
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
    <div
      ref={containerRef}
      className="relative w-full aspect-square max-w-xs md:max-w-sm lg:max-w-md mx-auto"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ contain: "layout paint size" }}
      />

      {/* City label overlays — positioned via direct DOM in animate() */}
      {CITIES.map((city, i) => (
        <div
          key={city.name}
          ref={(el) => { labelRefs.current[i] = el; }}
          className="absolute pointer-events-none"
          style={{
            display:   "none",
            opacity:   0,
            transform: "translate(-50%, -100%)",
            marginTop: "-10px",
          }}
        >
          {/* Line from dot upward */}
          <div className="flex flex-col items-center">
            <div
              className="text-white font-semibold whitespace-nowrap bg-white/10 backdrop-blur-sm border border-white/20 rounded px-1.5 py-0.5 mb-1"
              style={{ fontSize: "9px", letterSpacing: "0.04em" }}
            >
              {city.name}
            </div>
            <div className="w-px h-2 bg-white/50" />
          </div>
        </div>
      ))}
    </div>
  );
}
