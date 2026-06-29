import React from "react";
import { Star, Edit, Trash2 } from "lucide-react";

interface Review {
  id: string | number;
  rating: number;
  comment?: string;
  createdAt: string | Date;
  customerDisplayName?: string;
}

interface ReviewCardProps {
  review: Review;
  currentUser?: any;
  onEdit?: (review: Review) => void;
  onDelete?: (id: string | number) => void;
  anonymize?: boolean;
  themeStyle?: "detail" | "dashboard";
}

export const ReviewCard: React.FC<ReviewCardProps> = React.memo(({
  review,
  currentUser,
  onEdit,
  onDelete,
  anonymize = false,
  themeStyle = "detail"
}) => {
  const displayRating = review.rating || 5;
  const anonymizeName = (name: string) => {
    if (!name) return "Khách hàng GreenLife";
    if (name.length <= 2) return name + "*";
    return name.slice(0, 2) + "*".repeat(name.length - 2);
  };

  const displayName = anonymize
    ? anonymizeName(review.customerDisplayName || "")
    : review.customerDisplayName || "Khách hàng GreenLife";

  if (themeStyle === "dashboard") {
    return (
      <div className="p-4 bg-stone-900/40 border border-stone-850 rounded-2xl space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold text-white">{displayName}</span>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-3.5 h-3.5 ${star <= displayRating ? "text-amber-400 fill-current" : "text-stone-800"}`} />
              ))}
            </div>
          </div>
          <span className="text-[10px] text-stone-500 font-mono">
            {new Date(review.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit"
            })}
          </span>
        </div>
        <p className="text-stone-300 text-xs leading-relaxed font-sans mt-2">
          {review.comment || <span className="text-stone-500 italic">Khách hàng không để lại bình luận.</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-stone-900/10 dark:bg-stone-950/20 border border-stone-250 dark:border-stone-850 p-5 rounded-2xl space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-xs text-stone-800 dark:text-stone-200 font-semibold">{displayName}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`w-3.5 h-3.5 ${star <= displayRating ? "text-amber-400 fill-current" : "text-stone-700 dark:text-stone-800"}`} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-stone-400 font-mono">
            {new Date(review.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit"
            })}
          </span>
          {currentUser && review.customerDisplayName === currentUser.name && (onEdit || onDelete) && (
            <div className="flex gap-1.5">
              {onEdit && (
                <button
                  onClick={() => onEdit(review)}
                  className="p-1 text-stone-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Chỉnh sửa đánh giá"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(review.id)}
                  className="p-1 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Xóa đánh giá"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <p className="text-stone-600 dark:text-stone-300 text-xs leading-relaxed font-sans">
        {review.comment || <span className="text-stone-500 italic">Người dùng không viết bình luận.</span>}
      </p>
    </div>
  );
});

ReviewCard.displayName = "ReviewCard";
