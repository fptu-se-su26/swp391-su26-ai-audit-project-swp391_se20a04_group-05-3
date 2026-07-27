import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] select-none disabled:opacity-50 disabled:pointer-events-none active:scale-95";

  const variants = {
    primary: "bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-semibold shadow-md shadow-emerald-900/10 active:bg-[var(--gl-accent-hover)]",
    secondary: "bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] text-[var(--gl-text-primary)] border border-[var(--gl-border-subtle)]",
    outline: "bg-transparent border border-[var(--gl-border)] text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-muted)] hover:border-[var(--gl-accent)]",
    ghost: "bg-transparent text-[var(--gl-text-secondary)] hover:bg-[var(--gl-bg-muted)] hover:text-[var(--gl-text-primary)]",
    danger: "bg-[var(--gl-danger)] hover:opacity-90 text-white font-semibold shadow-md shadow-rose-950/20"
  };

  const sizes = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-xs uppercase tracking-wider",
    lg: "px-6 py-3.5 text-sm uppercase tracking-wider font-bold"
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
export default Button;
