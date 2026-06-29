import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 py-16 bg-stone-900/10 border border-stone-850 rounded-3xl max-w-lg mx-auto space-y-4 animate-fadeIn">
      <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-900/20 text-emerald-400">
        <Icon className="h-10 w-10 stroke-[1.5]" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl cursor-pointer transition-all duration-200 border border-emerald-400/20"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
