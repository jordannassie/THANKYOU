"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";

const THETA = 0.35;
const GLOBE_NDC_RADIUS = 0.8;
const SLOT_COUNT = 4;
const ROTATE_EVERY_MS = 5200;

const EMOJI_URL =
  "https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/Thankyou/Emojithank.png";

const LOCATIONS = [
  { city: "Rome, Italy", lat: 41.9028, lon: 12.4964 },
  { city: "Dallas, TX", lat: 32.7767, lon: -96.797 },
  { city: "London, UK", lat: 51.5074, lon: -0.1278 },
  { city: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
  { city: "Sydney, Australia", lat: -33.8688, lon: 151.2093 },
  { city: "Lagos, Nigeria", lat: 6.5244, lon: 3.3792 },
  { city: "Sao Paulo, Brazil", lat: -23.5505, lon: -46.6333 },
  { city: "Paris, France", lat: 48.8566, lon: 2.3522 },
  { city: "Nairobi, Kenya", lat: -1.2921, lon: 36.8219 },
  { city: "Seoul, South Korea", lat: 37.5665, lon: 126.978 },
  { city: "Mexico City, Mexico", lat: 19.4326, lon: -99.1332 },
  { city: "Toronto, Canada", lat: 43.6532, lon: -79.3832 },
  { city: "Dubai, UAE", lat: 25.2048, lon: 55.2708 },
  { city: "Mumbai, India", lat: 19.076, lon: 72.8777 },
  { city: "Cape Town, South Africa", lat: -33.9249, lon: 18.4241 },
  { city: "Manila, Philippines", lat: 14.5995, lon: 120.9842 },
  { city: "Berlin, Germany", lat: 52.52, lon: 13.405 },
  { city: "Buenos Aires, Argentina", lat: -34.6037, lon: -58.3816 },
  { city: "Bangkok, Thailand", lat: 13.7563, lon: 100.5018 },
  { city: "Cairo, Egypt", lat: 30.0444, lon: 31.2357 },
  { city: "Singapore", lat: 1.3521, lon: 103.8198 },
  { city: "Johannesburg, South Africa", lat: -26.2041, lon: 28.0473 },
  { city: "Los Angeles, CA", lat: 34.0522, lon: -118.2437 },
  { city: "New York, NY", lat: 40.7128, lon: -74.006 },
  { city: "Honolulu, HI", lat: 21.3069, lon: -157.8583 },
  { city: "Madrid, Spain", lat: 40.4168, lon: -3.7038 },
  { city: "Lima, Peru", lat: -12.0464, lon: -77.0428 },
  { city: "Jakarta, Indonesia", lat: -6.2088, lon: 106.8456 },
  { city: "Hong Kong", lat: 22.3193, lon: 114.1694 },
  { city: "Chicago, IL", lat: 41.8781, lon: -87.6298 },
];

const MESSAGES = [
  "Thank You, God!",
  "I'm thankful for today.",
  "Thank You for my family.",
  "God is good!",
  "Thank You for my future.",
];

type Location = (typeof LOCATIONS)[number];

type Slot = {
  key: string;
  message: string;
  location: Location;
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickLocations(count: number, exclude: Location[] = []): Location[] {
  const pool = LOCATIONS.filter((loc) => !exclude.includes(loc));
  const chosen: Location[] = [];
  const source = pool.length >= count ? pool : LOCATIONS;

  while (chosen.length < count && source.length > 0) {
    const next = pick(source.filter((loc) => !chosen.includes(loc)));
    if (!next) break;
    chosen.push(next);
  }
  return chosen;
}

function makeSlot(location: Location): Slot {
  return {
    key: `${location.city}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    message: pick(MESSAGES),
    location,
  };
}

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
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const phiRef = useRef(INITIAL_PHI);
  const [slots, setSlots] = useState<Slot[]>(() =>
    LOCATIONS.slice(0, SLOT_COUNT).map((location, i) => ({
      key: `seed-${i}`,
      message: MESSAGES[i % MESSAGES.length],
      location,
    }))
  );
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlots((current) => {
        const replaceAt = Math.floor(Math.random() * current.length);
        const used = current.map((slot) => slot.location);
        const [nextLocation] = pickLocations(1, used);
        if (!nextLocation) return current;
        return current.map((slot, i) => (i === replaceAt ? makeSlot(nextLocation) : slot));
      });
    }, ROTATE_EVERY_MS);

    return () => window.clearInterval(id);
  }, []);

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

      const cx = cssW / 2;
      const cy = cssW / 2;

      slotsRef.current.forEach((slot, i) => {
        const marker = markerRefs.current[i];
        const bubble = bubbleRefs.current[i];
        const p = project(slot.location.lat, slot.location.lon, phiRef.current, cssW);
        const visible = p.visible;
        const opacity = visible ? p.opacity : 0;

        if (marker) {
          marker.style.left = `${p.x}px`;
          marker.style.top = `${p.y}px`;
          marker.style.opacity = String(opacity.toFixed(3));
          marker.style.visibility = visible ? "visible" : "hidden";
        }

        if (bubble) {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const len = Math.hypot(dx, dy) || 1;
          const offset = Math.min(56, cssW * 0.1);
          bubble.style.left = `${p.x + (dx / len) * offset}px`;
          bubble.style.top = `${p.y + (dy / len) * offset}px`;
          bubble.style.opacity = String(opacity.toFixed(3));
          bubble.style.visibility = visible ? "visible" : "hidden";
        }
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
        className="absolute inset-[4%] sm:inset-[2%] overflow-visible"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ contain: "layout paint size" }}
        />

        {slots.map((slot, i) => (
          <div key={slot.key}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={(el) => {
                markerRefs.current[i] = el;
              }}
              src={EMOJI_URL}
              alt=""
              className="absolute pointer-events-none z-10 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 object-contain drop-shadow-[0_0_8px_rgba(253,201,43,0.45)]"
              style={{
                visibility: "hidden",
                opacity: 0,
                transform: "translate(-50%, -50%)",
              }}
            />
            <div
              ref={(el) => {
                bubbleRefs.current[i] = el;
              }}
              className="pointer-events-none absolute z-20 globe-bubble"
              style={{
                visibility: "hidden",
                opacity: 0,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="max-w-[158px] sm:max-w-[190px] rounded-2xl border border-white/15 bg-black/55 px-3.5 py-2 sm:px-4 sm:py-2.5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.28)]">
                <p className="text-[11px] sm:text-[13px] leading-snug text-white/92 font-medium tracking-wide">
                  {slot.message}
                </p>
                <p className="mt-1 text-[9px] sm:text-[10px] tracking-[0.16em] uppercase text-white/45">
                  {slot.location.city}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
