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
    emerald: "bg-emerald-950/85 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-950/85 text-amber-400 border-amber-500/20",
    rose: "bg-rose-950/85 text-rose-400 border-rose-500/20",
    indigo: "bg-indigo-950/85 text-indigo-400 border-indigo-500/20",
    stone: "bg-stone-900/90 text-stone-400 border-stone-800",
    spark: "bg-emerald-900/30 text-emerald-300 border-emerald-500/10 shadow-lg shadow-emerald-500/5 backdrop-blur-sm"
  };

  return (
    <span
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {variant === "spark" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
      )}
      {children}
    </span>
  );
};
export default Badge;
