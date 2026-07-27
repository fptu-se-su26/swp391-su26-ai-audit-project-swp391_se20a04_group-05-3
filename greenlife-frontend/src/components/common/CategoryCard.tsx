import React from "react";

interface Category {
  id: string;
  name?: string;
  label?: string;
  icon?: string;
}

interface CategoryCardProps {
  category: Category;
  isActive: boolean;
  onClick: (id: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = React.memo(({
  category,
  isActive,
  onClick
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(category.id)}
      className={`px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all min-h-[40px] inline-flex items-center justify-center border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
        isActive
          ? "bg-[var(--gl-accent)] text-white dark:text-emerald-950 border-[var(--gl-accent)] font-bold shadow-sm"
          : "bg-[var(--gl-bg-surface)] text-[var(--gl-text-secondary)] border-[var(--gl-border)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)]"
      }`}
    >
      {category.icon && <span className="mr-1.5">{category.icon}</span>}
      <span>{category.label || category.name || ""}</span>
    </button>
  );
});

CategoryCard.displayName = "CategoryCard";
