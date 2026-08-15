"use client";

import { useState } from "react";
import { Upload, Sparkles, Plus, Trash2, X } from "lucide-react";
import { mockVisionImages } from "@/lib/mock-data";

interface VisionImage {
  id: string;
  url: string;
  alt: string;
  category: string;
}

const PLACEHOLDER_IMAGES = [
  { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop", alt: "Beautiful home exterior", category: "Home" },
  { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", alt: "Fine dining", category: "Lifestyle" },
  { url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop", alt: "Nature landscape", category: "Travel" },
  { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop", alt: "Fitness training", category: "Health" },
];

export default function VisionBoardPage() {
  const [images, setImages] = useState<VisionImage[]>(mockVisionImages);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const random = PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
      setImages((prev) => [
        {
          id: `vi_${Date.now()}`,
          url: random.url,
          alt: prompt,
          category: "Vision",
        },
        ...prev,
      ]);
      setPrompt("");
      setGenerating(false);
      setShowAddModal(false);
    }, 1500);
  };

  const handleDelete = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Vision Board</h1>
          <p className="text-gray-500 text-sm mt-1">See the future you are believing God for.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 border border-gray-200 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            <Upload size={14} />
            Upload Image
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 bg-black text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors"
          >
            <Sparkles size={14} />
            Generate Image
          </button>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Add Vision card */}
        <button
          onClick={() => setShowAddModal(true)}
          className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all"
        >
          <Plus size={24} />
          <span className="text-xs font-medium">Add Vision</span>
        </button>

        {images.map((img) => (
          <div
            key={img.id}
            className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group"
            onMouseEnter={() => setHovered(img.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <img
              src={img.url}
              alt={img.alt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {hovered === img.id && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                <span className="text-white text-xs font-medium px-2 text-center">{img.alt}</span>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
              {img.category}
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">Your vision board is empty.</p>
          <p className="text-sm">Add your first vision image above.</p>
        </div>
      )}

      {/* Generate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Generate Vision Image</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Describe the vision you are believing God for and we will generate an image.
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A beautiful home with a pool surrounded by palm trees..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 border border-gray-200 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="flex-1 bg-black text-white text-sm font-medium py-3 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles size={14} />
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
