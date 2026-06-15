import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = "",
  id,
  ...props
}) => {
  const uniqueId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={uniqueId}
          className="text-xs text-stone-400 font-mono flex items-center gap-1.5"
        >
          {icon}
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={uniqueId}
          className={`w-full bg-stone-950 text-stone-200 border rounded-xl py-2.5 px-4 text-xs focus:outline-none transition-all duration-200 ${
            error
              ? "border-rose-500/80 focus:border-rose-500"
              : "border-stone-800 focus:border-emerald-500/50"
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <span className="text-[10px] text-rose-400 font-mono block">
          ⚠ {error}
        </span>
      )}
    </div>
  );
};
export default Input;
