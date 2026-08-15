"use client";

import { useState } from "react";
import { Crown } from "lucide-react";

interface Props {
  declaration: string;
  onSave?: (declaration: string) => void;
}

export default function DreamDeclaration({ declaration, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(declaration);
  const [current, setCurrent] = useState(declaration);

  const handleSave = () => {
    setCurrent(value);
    setEditing(false);
    onSave?.(value);
  };

  return (
    <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Decorative lines */}
      <div className="absolute top-6 left-8 right-8 flex items-center gap-3 pointer-events-none">
        <div className="h-px flex-1 bg-gray-200" />
        <Crown size={14} className="text-gray-400 shrink-0" />
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="px-8 pt-14 pb-10 text-center relative">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-medium mb-4">
          Dream Declaration
        </p>

        {editing ? (
          <div className="space-y-4">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full text-center font-serif text-2xl md:text-3xl lg:text-4xl font-medium leading-tight bg-transparent border-b-2 border-black focus:outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => { setValue(current); setEditing(false); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-900 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            className="cursor-pointer group"
            onClick={() => setEditing(true)}
            title="Click to edit"
          >
            <p className="font-serif text-2xl md:text-3xl lg:text-4xl font-medium leading-tight text-black">
              {current}
            </p>
            <p className="text-xs text-gray-400 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to edit
            </p>
          </div>
        )}

        {/* Decorative stars */}
        <div className="flex items-center justify-center gap-3 mt-6 pointer-events-none">
          <div className="h-px w-12 bg-gray-200" />
          <span className="text-gray-300 text-xs">✦</span>
          <span className="text-gray-400 text-sm">✦</span>
          <span className="text-gray-300 text-xs">✦</span>
          <div className="h-px w-12 bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
