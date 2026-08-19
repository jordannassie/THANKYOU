import type { Confession } from "@/lib/confessions/types";

interface Props {
  confession: Confession;
  className?: string;
}

export default function ConfessionListItem({ confession, className = "" }: Props) {
  return (
    <div className={`py-3 ${className}`}>
      <p className="text-sm font-medium text-gray-900 leading-snug">
        {confession.confession_text}
      </p>
      <p className="text-xs text-gray-400 mt-1">{confession.scripture_reference}</p>
    </div>
  );
}
