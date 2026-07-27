import React from "react";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => {
  const isClickable = Boolean(props.onClick);

  return (
    <div
      className={`bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] border border-[var(--gl-border-subtle)] rounded-2xl overflow-hidden shadow-sm transition-all duration-200 ${
        isClickable ? "hover:border-[var(--gl-border)] cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`p-5 pb-3 border-b border-[var(--gl-border-subtle)] flex flex-col gap-1.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div className={`p-5 space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`p-5 pt-3 border-t border-[var(--gl-border-subtle)] flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
