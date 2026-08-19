"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { VisionImage } from "@/lib/types";

interface Props {
  /** Increment this to trigger a re-fetch after a new image is generated. */
  refreshKey?: number;
  /** Maximum images to show. Defaults to 10. */
  limit?: number;
}

export default function VisionGrid({ refreshKey = 0, limit = 10 }: Props) {
  const [images, setImages] = useState<VisionImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    // setLoading(true) is intentionally omitted here to avoid synchronous
    // setState inside an effect. Initial loading=true state covers first load.
    // Subsequent refreshes (refreshKey changes) update images in-place silently.
    async function fetchImages() {
      const { data } = await supabase
        .from("vision_board_images")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!cancelled) {
        setImages((data as VisionImage[]) ?? []);
        setLoading(false);
      }
    }

    fetchImages();
    return () => { cancelled = true; };
  }, [refreshKey, limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm font-medium text-gray-500">Build the future you are believing for.</p>
        <p className="text-sm mt-1">Describe a vision above or upload your first image.</p>
        <Link
          href="/dashboard/vision-board"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-black mt-4 hover:underline"
        >
          Open Vision Board <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="aspect-square rounded-xl overflow-hidden bg-gray-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.image_url}
              alt={img.prompt ?? "Vision Board image"}
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
