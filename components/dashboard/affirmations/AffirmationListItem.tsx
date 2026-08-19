import type { Affirmation } from "@/lib/affirmations/types";

interface Props {
  affirmation: Affirmation;
  className?: string;
}

export default function AffirmationListItem({ affirmation, className = "" }: Props) {
  return (
    <div className={`py-3 ${className}`}>
      <p className="text-sm font-medium text-gray-900 leading-snug">
        {affirmation.affirmation_text}
      </p>
      <p className="text-xs text-gray-400 mt-1">{affirmation.scripture_reference}</p>
    </div>
  );
}
