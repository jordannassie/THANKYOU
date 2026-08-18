"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Upload,
  Sparkles,
  Plus,
  Trash2,
  X,
  Loader2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/UserProvider";
import type { VisionImage } from "@/lib/types";

// ── Constants ────────────────────────────────────────────────

const STORAGE_BUCKET = "vision-board";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ── Helpers ──────────────────────────────────────────────────

function generateId(): string {
  // crypto.randomUUID is available in modern browsers
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Component ────────────────────────────────────────────────

export default function VisionBoardPage() {
  const { user, isDemo } = useUser();
  // Memoize the client so it doesn't change identity on every render
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image state
  const [images, setImages] = useState<VisionImage[]>([]);
  const [loading, setLoading] = useState(true);
  // Increment to force a re-fetch from Supabase
  const [refreshKey, setRefreshKey] = useState(0);

  // Generate modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Viewer
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // ── Fetch images (inline in effect to satisfy react-hooks/purity) ─────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("vision_board_images")
        .select("*")
        .order("created_at", { ascending: false });

      if (!cancelled) {
        setImages((data as VisionImage[]) ?? []);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, refreshKey]);

  // ── Generate ─────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setGenerateError("");

    try {
      const res = await fetch("/api/vision/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      // Parse JSON safely — a timeout returns a non-JSON 502 page
      let json: { error?: string; image?: VisionImage } = {};
      try {
        json = await res.json();
      } catch {
        setGenerateError(`Server error (${res.status}) — generation may have timed out. Please try again.`);
        setGenerating(false);
        return;
      }

      if (!res.ok) {
        setGenerateError(json.error ?? `Error ${res.status} — please try again.`);
        setGenerating(false);
        return;
      }

      // Optimistic prepend — no full re-fetch needed
      const newImage = json.image as VisionImage;
      setImages((prev) => [newImage, ...prev]);
      setPrompt("");
      setShowGenerateModal(false);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Network error — please try again.");
    }

    setGenerating(false);
  };

  // ── Upload ───────────────────────────────────────────────

  const handleUploadClick = () => {
    setUploadError("");
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!e.target) return;
    // Reset so the same file can be re-selected if needed
    (e.target as HTMLInputElement).value = "";

    if (!file || !user) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Please upload a JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("Image must be under 10 MB.");
      return;
    }

    setUploading(true);
    setUploadError("");

    const imageId = generateId();
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const storagePath = `${user.id}/uploads/${imageId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadErr) {
      setUploadError("Your image could not be uploaded. Please try again.");
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

    const { data: record, error: dbErr } = await supabase
      .from("vision_board_images")
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        storage_path: storagePath,
        prompt: null,
        source: "uploaded",
      })
      .select()
      .single();

    if (dbErr) {
      setUploadError("Image saved but record failed. Please try again.");
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      setUploading(false);
      return;
    }

    setImages((prev) => [record as VisionImage, ...prev]);
    setUploading(false);
  };

  // ── Delete ───────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);

    const target = images.find((i) => i.id === confirmDeleteId);

    const { error: dbErr } = await supabase
      .from("vision_board_images")
      .delete()
      .eq("id", confirmDeleteId);

    if (!dbErr) {
      // Best-effort storage cleanup
      if (target?.storage_path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([target.storage_path]);
      }
      // Optimistic removal from UI
      setImages((prev) => prev.filter((i) => i.id !== confirmDeleteId));
      // Close viewer if it was showing the deleted image
      if (viewerIndex !== null) setViewerIndex(null);
    }

    setDeleting(false);
    setConfirmDeleteId(null);
  };

  // ── Viewer navigation ────────────────────────────────────

  const viewerImage = viewerIndex !== null ? images[viewerIndex] : null;

  const viewPrev = useCallback(
    () => setViewerIndex((i) => (i !== null && i > 0 ? i - 1 : i)),
    []
  );
  const viewNext = useCallback(
    () => setViewerIndex((i) => (i !== null && i < images.length - 1 ? i + 1 : i)),
    [images.length]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (viewerIndex === null) return;
      if (e.key === "ArrowLeft") viewPrev();
      if (e.key === "ArrowRight") viewNext();
      if (e.key === "Escape") setViewerIndex(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [viewerIndex, viewPrev, viewNext]);

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Vision Board</h1>
          <p className="text-gray-500 text-sm mt-1">See the future you are believing God for.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 border border-gray-200 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Uploading..." : "Upload Image"}
          </button>
          <button
            onClick={() => { setShowGenerateModal(true); setGenerateError(""); }}
            className="inline-flex items-center gap-1.5 bg-black text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors"
          >
            <Sparkles size={14} />
            Generate Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Upload error */}
      {uploadError && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{uploadError}</p>
      )}

      {/* Image grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Add card */}
            <button
              onClick={() => { setShowGenerateModal(true); setGenerateError(""); }}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all"
            >
              <Plus size={24} />
              <span className="text-xs font-medium">Add Vision</span>
            </button>

            {images.map((img, index) => (
              <div
                key={img.id}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={img.prompt ?? "Vision Board image"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex flex-col items-center justify-center gap-2">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    <button
                      onClick={() => setViewerIndex(index)}
                      className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                      title="View larger"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(img.id)}
                      className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-500/70 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {img.prompt && (
                    <p className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-[10px] px-3 text-center line-clamp-2 max-w-full">
                      {img.prompt}
                    </p>
                  )}
                </div>

                {/* Source badge */}
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {img.source === "generated" ? "AI" : "Upload"}
                </div>
              </div>
            ))}
          </div>

          {images.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm font-medium text-gray-500">Build the future you are believing for.</p>
              <p className="text-sm mt-1">Describe a vision above or upload your first image.</p>
            </div>
          )}
        </>
      )}

      {/* ── Generate Modal ──────────────────────────────────── */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Generate Vision Image</h2>
              <button
                onClick={() => { setShowGenerateModal(false); setGenerateError(""); }}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Demo / unauthenticated gate */}
            {(isDemo || !user) ? (
              <>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-500 mb-4">
                  <strong className="text-black block mb-1">Sign in to generate images</strong>
                  Create a free account to start building your vision board with AI-generated images.
                </div>
                <button
                  onClick={() => { setShowGenerateModal(false); setGenerateError(""); }}
                  className="w-full border border-gray-200 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Describe the vision you are believing God for and we will generate an image.
                </p>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A beautiful white home with a pool overlooking the ocean at sunset..."
                  rows={4}
                  maxLength={1000}
                  disabled={generating}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 resize-none disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{prompt.length}/1000</p>

                {generateError && (
                  <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl mt-3">
                    {generateError}
                  </p>
                )}

                {generating && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-xl">
                    <Loader2 size={15} className="animate-spin shrink-0" />
                    Creating your vision… this may take 20–40 seconds.
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => { setShowGenerateModal(false); setGenerateError(""); }}
                    disabled={generating}
                    className="flex-1 border border-gray-200 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating || prompt.trim().length < 3}
                    className="flex-1 bg-black text-white text-sm font-medium py-3 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <><Loader2 size={14} className="animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles size={14} /> Generate</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ─────────────────────────────── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-2">Delete Image?</h2>
            <p className="text-sm text-gray-500 mb-6">
              This image will be permanently removed from your Vision Board.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="flex-1 border border-gray-200 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Keep It
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 bg-black text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Viewer ────────────────────────────────────── */}
      {viewerIndex !== null && viewerImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewerIndex(null)}
        >
          {/* Close */}
          <button
            onClick={() => setViewerIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Prev */}
          {viewerIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); viewPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-3xl w-full max-h-[90vh] flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewerImage.image_url}
              alt={viewerImage.prompt ?? "Vision Board image"}
              className="max-h-[75vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            {viewerImage.prompt && (
              <p className="text-white/60 text-sm text-center max-w-lg leading-relaxed px-4">
                {viewerImage.prompt}
              </p>
            )}
            <p className="text-white/30 text-xs">
              {new Date(viewerImage.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {" · "}
              {viewerImage.source === "generated" ? "AI Generated" : "Uploaded"}
            </p>
          </div>

          {/* Next */}
          {viewerIndex < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); viewNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
