"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import type { Affirmation } from "@/lib/affirmations/types";

export type EditorAffirmation = Affirmation;

interface Props {
  initialAffirmations: Affirmation[];
  saving: boolean;
  onClose: () => void;
  onSave: (items: EditorAffirmation[]) => Promise<void>;
  onReset: () => Promise<void>;
}

function newDraftItem(order: number): EditorAffirmation {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `new-${Date.now()}-${order}`,
    affirmation_text: "",
    scripture_reference: "",
    sort_order: order,
  };
}

export default function AffirmationsEditorModal({
  initialAffirmations,
  saving,
  onClose,
  onSave,
  onReset,
}: Props) {
  const [items, setItems] = useState<EditorAffirmation[]>(
    initialAffirmations.map((a, i) => ({ ...a, sort_order: i }))
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const updateItem = (id: string, field: keyof EditorAffirmation, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next.map((item, i) => ({ ...item, sort_order: i })));
  };

  const handleSave = async () => {
    const valid = items.filter((i) => i.affirmation_text.trim());
    await onSave(valid.map((item, i) => ({ ...item, sort_order: i })));
  };

  const handleReset = async () => {
    setResetting(true);
    await onReset();
    setResetting(false);
    setShowResetConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
            <h2 className="text-xl font-bold tracking-tight">Edit Affirmations</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black transition-colors p-1"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Affirmation {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 text-gray-400 hover:text-black disabled:opacity-30 rounded-lg hover:bg-gray-50"
                      aria-label="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      className="p-1.5 text-gray-400 hover:text-black disabled:opacity-30 rounded-lg hover:bg-gray-50"
                      aria-label="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                      aria-label="Delete affirmation"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={item.affirmation_text}
                  onChange={(e) => updateItem(item.id, "affirmation_text", e.target.value)}
                  placeholder="Affirmation"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
                <input
                  type="text"
                  value={item.scripture_reference}
                  onChange={(e) => updateItem(item.id, "scripture_reference", e.target.value)}
                  placeholder="Scripture reference"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, newDraftItem(prev.length)])}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 py-3.5 rounded-xl hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              <Plus size={16} />
              Add Affirmation
            </button>
          </div>

          <div className="px-6 py-5 border-t border-gray-100 shrink-0 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 border border-gray-200 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              disabled={saving}
              className="flex-1 border border-gray-200 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Reset to Default Affirmations
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Reset your Daily Affirmations?</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              This will replace your personalized affirmations with the original Thank You Daily Affirmations.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="flex-1 border border-gray-200 text-sm font-medium py-3 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-900 disabled:opacity-50"
              >
                {resetting ? "Resetting…" : "Reset to Defaults"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
