"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { mockVisionImages } from "@/lib/mock-data";

export default function VisionGrid() {
  const preview = mockVisionImages.slice(0, 10);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {preview.map((img) => (
          <div
            key={img.id}
            className="aspect-square rounded-xl overflow-hidden bg-gray-100"
          >
            <img
              src={img.url}
              alt={img.alt}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <Link
          href="/dashboard/vision-board"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
        >
          View All Images
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
