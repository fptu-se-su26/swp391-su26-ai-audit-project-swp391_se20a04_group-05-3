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
    <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 py-10 sm:py-12 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl sm:rounded-3xl max-w-lg mx-auto space-y-4">
      <div className="p-3.5 sm:p-4 bg-[var(--gl-accent-soft)] rounded-2xl border border-[var(--gl-accent)]/20 text-[var(--gl-accent)]">
        <Icon className="h-8 w-8 sm:h-10 sm:w-10 stroke-[1.5]" />
      </div>
      
      <div className="space-y-1.5 max-w-sm mx-auto">
        <h3 className="text-base sm:text-lg font-bold text-[var(--gl-text-primary)] tracking-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-[var(--gl-text-secondary)] leading-relaxed">{description}</p>
      </div>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 px-5 py-2.5 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 text-xs font-bold rounded-xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] active:scale-[0.98]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
