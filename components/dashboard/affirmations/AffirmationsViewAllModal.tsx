"use client";

import { Check, X } from "lucide-react";
import type { Affirmation } from "@/lib/affirmations/types";
import AffirmationListItem from "./AffirmationListItem";

interface Props {
  affirmations: Affirmation[];
  completedToday: boolean;
  completing: boolean;
  onClose: () => void;
  onComplete: () => void;
  onEdit: () => void;
}

export default function AffirmationsViewAllModal({
  affirmations,
  completedToday,
  completing,
  onClose,
  onComplete,
  onEdit,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">My Daily Affirmations</h2>
            <p className="text-sm text-gray-500 mt-1">
              Speak God&apos;s Word over your life today.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors p-1 -mr-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 divide-y divide-gray-100">
          {affirmations.map((a) => (
            <AffirmationListItem key={a.id} affirmation={a} />
          ))}
        </div>

        <div className="px-6 py-5 border-t border-gray-100 shrink-0 space-y-3">
          <button
            onClick={onComplete}
            disabled={completedToday || completing}
            className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-3.5 rounded-xl transition-colors ${
              completedToday
                ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                : "bg-black text-white hover:bg-gray-900 disabled:opacity-50"
            }`}
          >
            <Check size={16} />
            {completedToday ? "Affirmations Completed Today" : "I Spoke My Affirmations Today"}
          </button>
          <button
            onClick={onEdit}
            className="w-full text-sm font-medium text-gray-600 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Edit My Affirmations
          </button>
        </div>
      </div>
    </div>
  );
}
