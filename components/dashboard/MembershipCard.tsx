import { Crown } from "lucide-react";
import { mockMembership } from "@/lib/mock-data";

export default function MembershipCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
          <Crown size={14} className="text-white" />
        </div>
        <span className="text-sm font-medium text-gray-500">Premium Membership</span>
      </div>
      <div>
        <p className="text-4xl font-bold tracking-tight">{mockMembership.price}</p>
        <p className="text-sm text-gray-500 mt-1">Weekly Zoom Calls</p>
      </div>
      <button className="mt-auto w-full border border-gray-200 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
        Manage Membership
      </button>
    </div>
  );
}
