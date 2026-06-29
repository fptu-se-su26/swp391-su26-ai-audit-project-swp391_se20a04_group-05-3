import React from "react";

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-stone-950 border border-stone-850 rounded-3xl p-5 space-y-4 animate-pulse">
      <div className="w-full h-48 bg-stone-900 rounded-2xl" />
      <div className="space-y-2">
        <div className="h-4 bg-stone-900 rounded w-2/3" />
        <div className="h-3 bg-stone-900 rounded w-1/2" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-5 bg-stone-900 rounded w-1/3" />
        <div className="h-8 bg-stone-900 rounded-xl w-1/4" />
      </div>
    </div>
  );
};

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex gap-4 p-4 bg-stone-950 border border-stone-850 rounded-2xl items-center">
          <div className="w-12 h-12 bg-stone-900 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-stone-900 rounded w-1/3" />
            <div className="h-3 bg-stone-900 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 4, cols = 5 }) => {
  return (
    <div className="border border-stone-850 rounded-2xl overflow-hidden bg-stone-950 animate-pulse">
      <div className="bg-stone-900 h-10 w-full border-b border-stone-850" />
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex justify-between gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div key={cIdx} className="h-4 bg-stone-900 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-stone-950 border border-stone-850 p-5 rounded-3xl space-y-3">
            <div className="h-3 bg-stone-900 rounded w-1/2" />
            <div className="h-6 bg-stone-900 rounded w-3/4" />
          </div>
        ))}
      </div>
      <div className="bg-stone-950 border border-stone-850 p-6 rounded-3xl space-y-4">
        <div className="h-4 bg-stone-900 rounded w-1/4" />
        <div className="h-64 bg-stone-900 rounded-2xl" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <CardSkeleton key={idx} />
      ))}
    </div>
  );
};

export const NotificationSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="divide-y divide-stone-850 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-3.5 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-stone-900 rounded w-1/3" />
            <div className="h-3 bg-stone-900 rounded w-1/6" />
          </div>
          <div className="h-3 bg-stone-900 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
};
