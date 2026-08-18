"use client";

import { Video } from "lucide-react";
import { mockZoomCall } from "@/lib/mock-data";

export default function ZoomCard() {
  const units = [
    { value: String(mockZoomCall.days).padStart(2, "0"), label: "DAYS" },
    { value: String(mockZoomCall.hours).padStart(2, "0"), label: "HRS" },
    { value: String(mockZoomCall.minutes).padStart(2, "0"), label: "MINS" },
    { value: String(mockZoomCall.seconds).padStart(2, "0"), label: "SECS" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">Next Zoom Call</span>
        <img
          src="https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/Zoom-Logo.png"
          alt="Zoom"
          className="h-5 w-auto object-contain"
        />
      </div>
      <div className="flex items-end gap-3">
        {units.map((unit, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-2xl font-bold tabular-nums">{unit.value}</span>
            <span className="text-[9px] text-gray-400 font-semibold tracking-widest mt-0.5">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
      <button className="w-full bg-black text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors">
        View Call Details
      </button>
      <p className="text-xs text-gray-400 text-center leading-relaxed">
        {mockZoomCall.description}
      </p>
    </div>
  );
}
