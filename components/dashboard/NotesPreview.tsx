"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Heart, Target, Zap, Shield } from "lucide-react";
import { mockNotes } from "@/lib/mock-data";

export default function NotesPreview() {
  const [selectedId, setSelectedId] = useState(mockNotes[0].id);
  const selected = mockNotes.find((n) => n.id === selectedId) || mockNotes[0];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-semibold">My Notes</h2>
          <p className="text-sm text-gray-500">Daily gratitude. Prayer. Reflections. Faith in action.</p>
        </div>
        <Link
          href="/dashboard/notes"
          className="inline-flex items-center gap-1.5 bg-black text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-900 transition-colors"
        >
          <Plus size={15} />
          New Note
        </Link>
      </div>

      <div className="flex divide-x divide-gray-100">
        {/* Date list */}
        <div className="w-44 shrink-0 py-3">
          {mockNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelectedId(note.id)}
              className={`w-full text-left px-5 py-3 transition-colors ${
                selectedId === note.id
                  ? "bg-gray-50 border-l-2 border-black"
                  : "hover:bg-gray-50 border-l-2 border-transparent"
              }`}
            >
              <p className="text-sm font-medium text-black">{note.date}</p>
              <p className="text-xs text-gray-400">{note.dateLabel}</p>
            </button>
          ))}
        </div>

        {/* Note content */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[520px]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-base">{selected.date}</h3>
            <button className="text-gray-400 hover:text-black transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="space-y-5">
            <NoteSection icon={<Heart size={14} />} title="Today I'm grateful for:">
              <ul className="space-y-1">
                {selected.grateful.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-300 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </NoteSection>

            <NoteSection icon={<Target size={14} />} title="Today I'm praying for:">
              <ul className="space-y-1">
                {selected.prayer.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-300 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </NoteSection>

            <NoteSection icon={<Zap size={14} />} title="Today I will take action by:">
              <ol className="space-y-1">
                {selected.action.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400 shrink-0 font-medium">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ol>
            </NoteSection>

            <NoteSection icon={<Shield size={14} />} title="Declaration of faith:">
              <p className="text-sm text-gray-700 font-medium italic">{selected.declaration}</p>
            </NoteSection>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 italic leading-relaxed">
                {selected.scripture}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-100">
        <Link
          href="/dashboard/notes"
          className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
        >
          View All Notes
        </Link>
      </div>
    </div>
  );
}

function NoteSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-black">{icon}</span>
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      {children}
    </div>
  );
}
