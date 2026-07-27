import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "emerald" | "amber" | "rose" | "indigo" | "stone" | "spark";
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "stone",
  children,
  className = "",
  ...props
}) => {
  const baseStyle = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider font-semibold border";

  const variants = {
    emerald: "bg-emerald-100/90 dark:bg-emerald-950/85 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30",
    amber: "bg-amber-100/90 dark:bg-amber-950/85 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30",
    rose: "bg-rose-100/90 dark:bg-rose-950/85 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30",
    indigo: "bg-indigo-100/90 dark:bg-indigo-950/85 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30",
    stone: "bg-[var(--gl-bg-elevated)] text-[var(--gl-text-secondary)] border-[var(--gl-border)]",
    spark: "bg-[var(--gl-accent-soft)] text-emerald-800 dark:text-emerald-300 border-emerald-500/30 shadow-sm backdrop-blur-sm"
  };

  return (
    <span
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {variant === "spark" && (
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--gl-accent)] animate-pulse inline-block" />
      )}
      {children}
    </span>
  );
};
export default Badge;
