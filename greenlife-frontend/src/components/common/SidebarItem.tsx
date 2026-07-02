import React from "react";

interface SidebarItemProps {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  isActive: boolean;
  onClick: (id: string) => void;
  isMobile?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = React.memo(({
  id,
  label,
  icon: Icon,
  isActive,
  onClick,
  isMobile = false
}) => {
  if (isMobile) {
    return (
      <button
        onClick={() => onClick(id)}
        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium w-full text-left cursor-pointer nav-item-animated ${
          isActive
            ? "active bg-emerald-950/80 text-emerald-400 border border-emerald-500/20"
            : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 nav-icon" />
          {label}
        </div>
        {isActive && <span className="nav-active-dot mr-1" />}
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick(id)}
      className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer nav-item-animated transition-all ${
        isActive
          ? "active bg-emerald-950/60 text-emerald-400 border border-emerald-500/15 shadow-sm"
          : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4 nav-icon" />
        {label}
      </div>
      {isActive && <span className="nav-active-dot" />}
    </button>
  );
});

SidebarItem.displayName = "SidebarItem";
