import React from "react";
import { NotificationItem as NotificationItemType } from "../../types";
import { Trash2 } from "lucide-react";

interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = React.memo(({
  notification,
  onMarkAsRead,
  onDelete
}) => {
  return (
    <div
      className={`p-3.5 flex items-start justify-between gap-3 text-xs transition-all relative border-b border-[var(--gl-border-subtle)] ${
        !notification.isRead
          ? "bg-[var(--gl-accent-soft)]/30 border-l-4 border-l-[var(--gl-accent)]"
          : "bg-[var(--gl-bg-surface)] hover:bg-[var(--gl-bg-muted)] border-l-4 border-l-transparent"
      }`}
    >
      <div
        className="flex-1 space-y-1 cursor-pointer min-w-0"
        onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
      >
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-xs leading-snug break-words ${!notification.isRead ? "text-[var(--gl-text-primary)] font-bold" : "text-[var(--gl-text-secondary)] font-medium"}`}>
              {notification.title}
            </span>
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-[var(--gl-accent)] shrink-0 inline-block" aria-hidden="true" title="Chưa đọc" />
            )}
          </div>
          <span className="text-[10px] text-[var(--gl-text-muted)] font-mono shrink-0">
            {new Date(notification.createdAt).toLocaleDateString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        </div>
        <p className="text-[var(--gl-text-secondary)] leading-normal line-clamp-2 break-words">{notification.message}</p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="w-7 h-7 flex items-center justify-center text-[var(--gl-text-muted)] hover:text-[var(--gl-danger)] hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0 self-start mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
        title="Xóa thông báo"
        aria-label={`Xóa thông báo ${notification.title}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});

NotificationItem.displayName = "NotificationItem";
