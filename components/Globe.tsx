"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

// Must match the globe config
const THETA = 0.35;
// Radius factor: COBE renders the globe within NDC radius 0.8
const GLOBE_NDC_RADIUS = 0.8;

const CITIES = [
  { name: "Dallas, TX",   lat:  32.7767, lon:  -96.797 },
  { name: "London, UK",   lat:  51.5074, lon:   -0.1278 },
  { name: "Dubai, UAE",   lat:  25.2048, lon:   55.2708 },
  { name: "Hong Kong",    lat:  22.3193, lon:  114.1694 },
  { name: "Johannesburg", lat: -26.2041, lon:   28.0473 },
];

/**
 * Accurate projection matching COBE's internal WebGL coordinate system.
 *
 * COBE converts (lat, lon) → 3D via:
 *   a = lon_rad - π
 *   px = -cos(lat) * cos(a)  =  cos(lat) * cos(lon_rad)
 *   py =  sin(lat)
 *   pz =  cos(lat) * sin(a)  = -cos(lat) * sin(lon_rad)   ← note the negative z
 *
 * Then it applies rotation matrix A(theta, phi) (GLSL h*A convention).
 * To project globe→screen we apply the transpose A^T:
 *   sx =  cos(phi)*px + sin(phi)*pz
 *   sy =  sin(phi)*sin(theta)*px + cos(theta)*py - cos(phi)*sin(theta)*pz
 *   sz = -sin(phi)*cos(theta)*px + sin(theta)*py + cos(phi)*cos(theta)*pz
 *
 * Visible when sz > 0.  Screen CSS coords: (cx + sx*r, cy - sy*r)
 * where r = GLOBE_NDC_RADIUS * cssHalf.
 */
function project(
  lat: number,
  lon: number,
  phi: number,
  cssW: number
): { x: number; y: number; visible: boolean; opacity: number } {
  const latR = (lat * Math.PI) / 180;
  const lonR = (lon * Math.PI) / 180;

  // Globe-local 3D (COBE convention — z is negated vs standard spherical)
  const px =  Math.cos(latR) * Math.cos(lonR);
  const py =  Math.sin(latR);
  const pz = -Math.cos(latR) * Math.sin(lonR);

  // Projection: globe-space → screen-space via A^T(theta, phi)
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosT   = Math.cos(THETA);
  const sinT   = Math.sin(THETA);

  const sx =  cosPhi * px + sinPhi * pz;
  const sy =  sinPhi * sinT * px + cosT * py - cosPhi * sinT * pz;
  const sz = -sinPhi * cosT * px + sinT * py + cosPhi * cosT * pz;

  const r = GLOBE_NDC_RADIUS * (cssW / 2);

  return {
    x: cssW / 2 + sx * r,
    y: cssW / 2 - sy * r,
    visible: sz > 0,
    // Fade labels in as they rotate into view, out as they rotate away
    opacity: Math.max(0, Math.min(1, (sz + 0.06) / 0.18)),
  };
}

// phi that puts Dallas roughly front-and-center at start
// facing_lon = -(phi + π/2) → phi = -(lon_rad + π/2)
const DALLAS_LON_RAD = (-96.797 * Math.PI) / 180;
const INITIAL_PHI = -(DALLAS_LON_RAD + Math.PI / 2); // ≈ 0.118

export default function Globe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const labelRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const phiRef       = useRef(INITIAL_PHI);

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
      markers: CITIES.map((c) => ({
        location: [c.lat, c.lon] as [number, number],
        size: 0.06,
      })),
    });

    let animId: number;

    function animate() {
      phiRef.current += 0.004; // slow continuous world tour
      globe.update({ phi: phiRef.current, width: cssW * 2, height: cssW * 2 });

      // Reposition each label directly in the DOM — no React re-render
      CITIES.forEach((city, i) => {
        const el = labelRefs.current[i];
        if (!el) return;
        const p = project(city.lat, city.lon, phiRef.current, cssW);
        el.style.left    = `${p.x}px`;
        el.style.top     = `${p.y}px`;
        el.style.opacity = String(p.opacity.toFixed(3));
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

      {CITIES.map((city, i) => (
        <div
          key={city.name}
          ref={(el) => { labelRefs.current[i] = el; }}
          className="absolute pointer-events-none"
          style={{
            display:   "none",
            opacity:   0,
            // Centre the label horizontally above the dot
            transform: "translate(-50%, calc(-100% - 6px))",
          }}
        >
          <div className="flex flex-col items-center">
            <span
              className="whitespace-nowrap bg-white/10 backdrop-blur-sm border border-white/25 text-white font-semibold rounded px-2 py-0.5 leading-tight"
              style={{ fontSize: "9px", letterSpacing: "0.05em" }}
            >
              {city.name}
            </span>
            {/* Connector line from label down to dot */}
            <div className="w-px h-2 bg-white/40 mt-0.5" />
          </div>
        </div>
      ))}
    </div>
  );
}
