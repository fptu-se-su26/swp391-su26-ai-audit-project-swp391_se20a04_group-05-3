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
      onClick={() => onClick(category.id)}
      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
        isActive
          ? "bg-emerald-500 text-black shadow-md font-semibold"
          : "bg-stone-900 text-stone-400 border border-stone-850 hover:text-stone-200"
      }`}
    >
      {category.icon && <span className="mr-1.5">{category.icon}</span>}
      {category.label || category.name || ""}
    </button>
  );
});

CategoryCard.displayName = "CategoryCard";
