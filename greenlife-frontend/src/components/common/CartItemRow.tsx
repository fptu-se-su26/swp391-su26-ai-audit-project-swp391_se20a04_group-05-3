import React from "react";
import { CartItem } from "../../types";
import { Minus, Plus, Trash2 } from "lucide-react";
import { getMediaUrl } from "../../utils/mediaUrl";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, offset: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = React.memo(({
  item,
  onUpdateQuantity,
  onRemove
}) => {
  return (
    <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-3 sm:p-3.5 rounded-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs transition-all hover:border-[var(--gl-border-subtle)]">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <img
          src={getMediaUrl(item.product.image)}
          alt={item.product.name}
          className="w-12 h-12 shrink-0 object-cover rounded-xl border border-[var(--gl-border-subtle)] bg-[var(--gl-bg-muted)]"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="space-y-0.5 min-w-0 flex-1">
          <span className="font-semibold text-[var(--gl-text-primary)] block truncate" title={item.product.name}>
            {item.product.name}
          </span>
          <span className="text-[var(--gl-accent)] font-mono font-bold block mt-0.5">
            {(item.product.price * item.quantity).toLocaleString("vi-VN")}₫
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
        {/* Dec/Inc Quantity buttons with min 40x40px touch area */}
        <div className="flex items-center bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.product.id, -1)}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] cursor-pointer"
            aria-label="Giảm số lượng"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="px-2.5 text-xs font-semibold text-[var(--gl-text-primary)] font-mono select-none min-w-[24px] text-center">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.product.id, 1)}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] cursor-pointer"
            aria-label="Tăng số lượng"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.product.id)}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--gl-text-muted)] hover:text-[var(--gl-danger)] hover:bg-rose-500/10 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] cursor-pointer"
          title="Xóa khỏi giỏ"
          aria-label={`Xóa ${item.product.name} khỏi giỏ hàng`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

CartItemRow.displayName = "CartItemRow";
