"use client";

import { useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  X,
  Heart,
  Target,
  Zap,
  Shield,
} from "lucide-react";
import { mockNotes, Note } from "@/lib/mock-data";

function generateId() {
  return `note_${Date.now()}`;
}

const emptyNote = (): Omit<Note, "id"> => ({
  date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  dateLabel: "Today",
  grateful: [""],
  prayer: [""],
  action: [""],
  declaration: "",
  scripture: "",
});

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [selectedId, setSelectedId] = useState(mockNotes[0].id);
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Omit<Note, "id"> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selected = notes.find((n) => n.id === selectedId) || notes[0];

  const openNewNote = () => {
    setEditingNote(emptyNote());
    setEditingId(null);
    setShowModal(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote({ ...note });
    setEditingId(note.id);
    setShowModal(true);
    setShowMenu(null);
  };

  const saveNote = () => {
    if (!editingNote) return;
    if (editingId) {
      setNotes((prev) =>
        prev.map((n) => (n.id === editingId ? { ...editingNote, id: editingId } : n))
      );
      setSelectedId(editingId);
    } else {
      const newNote: Note = { ...editingNote, id: generateId() };
      setNotes((prev) => [newNote, ...prev]);
      setSelectedId(newNote.id);
    }
    setShowModal(false);
    setEditingNote(null);
    setEditingId(null);
  };

  const deleteNote = (id: string) => {
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (selectedId === id && remaining.length > 0) {
      setSelectedId(remaining[0].id);
    }
    setShowMenu(null);
  };

  const updateListItem = (
    field: "grateful" | "prayer" | "action",
    index: number,
    value: string
  ) => {
    if (!editingNote) return;
    const arr = [...editingNote[field]];
    arr[index] = value;
    setEditingNote({ ...editingNote, [field]: arr });
  };

  const addListItem = (field: "grateful" | "prayer" | "action") => {
    if (!editingNote) return;
    setEditingNote({ ...editingNote, [field]: [...editingNote[field], ""] });
  };

  const removeListItem = (field: "grateful" | "prayer" | "action", index: number) => {
    if (!editingNote) return;
    const arr = editingNote[field].filter((_, i) => i !== index);
    setEditingNote({ ...editingNote, [field]: arr.length > 0 ? arr : [""] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Notes</h1>
          <p className="text-gray-500 text-sm mt-1">Gratitude. Prayer. Reflections. Faith in action.</p>
        </div>
        <button
          onClick={openNewNote}
          className="inline-flex items-center gap-1.5 bg-black text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors"
        >
          <Plus size={15} />
          New Note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">No notes yet.</p>
          <button
            onClick={openNewNote}
            className="mt-4 inline-flex items-center gap-1.5 bg-black text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors"
          >
            <Plus size={15} /> Create First Note
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Date list */}
            <div className="md:w-48 shrink-0 md:border-r border-gray-100">
              <div className="md:max-h-[680px] overflow-y-auto">
                {notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => setSelectedId(note.id)}
                    className={`w-full text-left px-5 py-4 transition-colors border-b border-gray-50 ${
                      selectedId === note.id
                        ? "bg-gray-50 border-l-2 border-l-black"
                        : "hover:bg-gray-50 border-l-2 border-l-transparent"
                    }`}
                  >
                    <p className="text-sm font-medium">{note.date}</p>
                    <p className="text-xs text-gray-400">{note.dateLabel}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Note content */}
            {selected && (
              <div className="flex-1 p-6 overflow-y-auto md:max-h-[680px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg">{selected.date}</h3>
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(showMenu === selected.id ? null : selected.id)}
                      className="text-gray-400 hover:text-black transition-colors p-1"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {showMenu === selected.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10 min-w-[130px]">
                        <button
                          onClick={() => openEditNote(selected)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          Edit Note
                        </button>
                        <button
                          onClick={() => deleteNote(selected.id)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <NoteSection icon={<Heart size={14} />} title="Today I'm grateful for:">
                    <ul className="space-y-1.5">
                      {selected.grateful.filter(Boolean).map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-gray-300 mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </NoteSection>

                  <NoteSection icon={<Target size={14} />} title="Today I'm praying for:">
                    <ul className="space-y-1.5">
                      {selected.prayer.filter(Boolean).map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-gray-300 mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </NoteSection>

                  <NoteSection icon={<Zap size={14} />} title="Today I will take action by:">
                    <ol className="space-y-1.5">
                      {selected.action.filter(Boolean).map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-gray-400 font-medium shrink-0">{i + 1}.</span> {item}
                        </li>
                      ))}
                    </ol>
                  </NoteSection>

                  <NoteSection icon={<Shield size={14} />} title="Declaration of faith:">
                    <p className="text-sm text-gray-700 font-medium italic">{selected.declaration}</p>
                  </NoteSection>

                  {selected.scripture && (
                    <div className="pt-5 border-t border-gray-100">
                      <p className="text-xs text-gray-400 italic leading-relaxed">{selected.scripture}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      {showModal && editingNote && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">
                {editingId ? "Edit Note" : "New Note"}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingNote(null); }}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-sm font-medium mb-1.5">Date</label>
                <input
                  type="text"
                  value={editingNote.date}
                  onChange={(e) => setEditingNote({ ...editingNote, date: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              {(["grateful", "prayer", "action"] as const).map((field) => {
                const labels: Record<string, string> = {
                  grateful: "Today I'm grateful for:",
                  prayer: "Today I'm praying for:",
                  action: "Today I will take action by:",
                };
                return (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-2">{labels[field]}</label>
                    <div className="space-y-2">
                      {editingNote[field].map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateListItem(field, i, e.target.value)}
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                            placeholder={`Add item ${i + 1}...`}
                          />
                          <button
                            onClick={() => removeListItem(field, i)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addListItem(field)}
                        className="text-sm text-gray-400 hover:text-black transition-colors flex items-center gap-1"
                      >
                        <Plus size={13} /> Add item
                      </button>
                    </div>
                  </div>
                );
              })}

              <div>
                <label className="block text-sm font-medium mb-1.5">Declaration of faith:</label>
                <textarea
                  value={editingNote.declaration}
                  onChange={(e) => setEditingNote({ ...editingNote, declaration: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
                  placeholder="I believe God is..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Scripture (optional):</label>
                <input
                  type="text"
                  value={editingNote.scripture}
                  onChange={(e) => setEditingNote({ ...editingNote, scripture: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="e.g. Jeremiah 29:11"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => { setShowModal(false); setEditingNote(null); }}
                className="flex-1 border border-gray-200 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                className="flex-1 bg-black text-white text-sm font-medium py-3 rounded-xl hover:bg-gray-900 transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
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
