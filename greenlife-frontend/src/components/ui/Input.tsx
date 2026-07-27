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
  disabled,
  ...props
}) => {
  const uniqueId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={uniqueId}
          className="text-xs text-[var(--gl-text-secondary)] font-mono flex items-center gap-1.5"
        >
          {icon}
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={uniqueId}
          disabled={disabled}
          className={`w-full bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] border rounded-xl py-2.5 px-4 text-xs focus:outline-none transition-all duration-200 disabled:bg-[var(--gl-bg-muted)] disabled:text-[var(--gl-text-muted)] disabled:border-[var(--gl-border-subtle)] disabled:cursor-not-allowed disabled:opacity-70 ${
            error
              ? "border-[var(--gl-danger)] focus:border-[var(--gl-danger)] focus-visible:ring-2 focus-visible:ring-[var(--gl-danger)]/40"
              : "border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <span className="text-[10px] text-[var(--gl-danger)] font-mono block">
          ⚠ {error}
        </span>
      )}
    </div>
  );
};
export default Input;
