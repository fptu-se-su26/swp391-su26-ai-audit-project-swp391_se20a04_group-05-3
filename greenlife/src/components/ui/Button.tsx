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
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 cursor-pointer focus:outline-none select-none disabled:opacity-50 disabled:pointer-events-none active:scale-95";

  const variants = {
    primary: "bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-md shadow-emerald-950/20 active:bg-emerald-600",
    secondary: "bg-stone-800 hover:bg-stone-755 text-stone-200 border border-stone-700 hover:text-white",
    outline: "bg-transparent border border-stone-700 text-stone-300 hover:bg-stone-900 hover:text-white hover:border-stone-500",
    ghost: "bg-transparent hover:bg-stone-900 text-stone-400 hover:text-stone-100",
    danger: "bg-rose-500 hover:bg-rose-450 text-white font-semibold shadow-md shadow-rose-950/20"
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
        <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
export default Button;
