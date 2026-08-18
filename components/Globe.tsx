"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

// Dallas, TX
const DALLAS_LAT = 32.7767;
const DALLAS_LON = -96.797;

// Convert longitude → phi so the globe faces Dallas
function lonToPhi(lon: number): number {
  return ((lon + 180) / 360) * 2 * Math.PI - Math.PI;
}

export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let width = canvasRef.current.offsetWidth || 400;

    const onResize = () => {
      if (canvasRef.current) width = canvasRef.current.offsetWidth;
    };
    window.addEventListener("resize", onResize);

    const basePhi = lonToPhi(DALLAS_LON);

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: basePhi,
      theta: 0.35,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 20000,
      mapBrightness: 3.5,
      baseColor: [0.1, 0.1, 0.18],
      markerColor: [1, 1, 1],
      glowColor: [0.15, 0.25, 0.6],
      markers: [{ location: [DALLAS_LAT, DALLAS_LON], size: 0.07 }],
    });

    // Animation loop — gentle oscillation centred on Dallas
    let animId: number;
    function animate() {
      const phi = basePhi + Math.sin(Date.now() / 9000) * 0.18;
      globe.update({ phi, width: width * 2, height: width * 2 });
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
    <div className="relative w-full aspect-square max-w-xs md:max-w-sm lg:max-w-md mx-auto">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ contain: "layout paint size" }}
      />
    </div>
  );
}
