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
      <div className="p-4 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold text-[var(--gl-text-primary)]">{displayName}</span>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-3.5 h-3.5 ${star <= displayRating ? "text-amber-400 fill-current" : "text-[var(--gl-text-muted)]"}`} />
              ))}
            </div>
          </div>
          <span className="text-[10px] text-[var(--gl-text-muted)] font-mono">
            {new Date(review.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit"
            })}
          </span>
        </div>
        <p className="text-[var(--gl-text-secondary)] text-xs leading-relaxed font-sans mt-2 break-words">
          {review.comment || <span className="text-[var(--gl-text-muted)] italic">Khách hàng không để lại bình luận.</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-5 rounded-2xl space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-xs text-[var(--gl-text-primary)] font-semibold">{displayName}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`w-3.5 h-3.5 ${star <= displayRating ? "text-amber-400 fill-current" : "text-[var(--gl-text-muted)]"}`} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--gl-text-muted)] font-mono">
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
                  type="button"
                  onClick={() => onEdit(review)}
                  aria-label="Chỉnh sửa đánh giá"
                  className="p-1.5 text-[var(--gl-text-muted)] hover:text-[var(--gl-accent)] hover:bg-[var(--gl-bg-muted)] rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Chỉnh sửa đánh giá"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(review.id)}
                  aria-label="Xóa đánh giá"
                  className="p-1.5 text-[var(--gl-text-muted)] hover:text-[var(--gl-danger)] hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Xóa đánh giá"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <p className="text-[var(--gl-text-secondary)] text-xs leading-relaxed font-sans break-words">
        {review.comment || <span className="text-[var(--gl-text-muted)] italic">Người dùng không viết bình luận.</span>}
      </p>
    </div>
  );
});

ReviewCard.displayName = "ReviewCard";
