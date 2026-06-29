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
      className={`p-3.5 flex justify-between gap-3 text-xs transition-all relative ${
        !notification.isRead ? "bg-emerald-950/20 border-l-2 border-emerald-500" : "hover:bg-stone-900/20"
      }`}
    >
      <div 
        className="flex-1 space-y-1 cursor-pointer" 
        onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
      >
        <div className="flex items-center justify-between">
          <span className={`font-semibold ${!notification.isRead ? "text-white" : "text-stone-300"}`}>
            {notification.title}
          </span>
          <span className="text-[10px] text-stone-500 font-mono">
            {new Date(notification.createdAt).toLocaleDateString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        </div>
        <p className="text-stone-400 leading-normal line-clamp-2">{notification.message}</p>
      </div>
      
      <button
        onClick={() => onDelete(notification.id)}
        className="p-1 text-stone-600 hover:text-rose-450 transition-colors cursor-pointer shrink-0 self-center"
        title="Xóa"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});

NotificationItem.displayName = "NotificationItem";
