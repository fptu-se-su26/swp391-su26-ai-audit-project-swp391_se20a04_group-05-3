import React from "react";
import { CartItem } from "../../types";
import { Minus, Plus, Trash2 } from "lucide-react";
import { getMediaUrl } from "../../utils/mediaUrl";

interface CartItemRowProps {
  item: CartItem;
  isSelected?: boolean;
  onToggleSelect?: (itemId: number) => void;
  onUpdateQuantity: (productId: string, offset: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = React.memo(({
  item,
  isSelected,
  onToggleSelect,
  onUpdateQuantity,
  onRemove
}) => {
  const lineAmount = item.lineEffectiveAmount !== undefined
    ? item.lineEffectiveAmount
    : item.lineBaseAmount !== undefined
      ? item.lineBaseAmount
      : (item.effectiveUnitPrice ?? item.product.price) * item.quantity;

  return (
    <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-3 sm:p-3.5 rounded-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs transition-all hover:border-[var(--gl-border-subtle)]">
      {/* Item Checkbox */}
      {item.id !== undefined && onToggleSelect && (
        <input
          type="checkbox"
          checked={Boolean(isSelected)}
          onChange={() => onToggleSelect(item.id!)}
          className="w-4 h-4 rounded text-[var(--gl-accent)] focus:ring-[var(--gl-focus-ring)] accent-[var(--gl-accent)] cursor-pointer shrink-0"
          aria-label={`Chọn sản phẩm ${item.product.name}`}
        />
      )}

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

          {item.onSale && item.effectiveUnitPrice !== undefined ? (
            <div className="space-y-0.5 mt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[var(--gl-text-muted)] line-through font-mono">
                  {(item.baseUnitPrice !== undefined ? item.baseUnitPrice : item.product.price).toLocaleString("vi-VN")}₫
                </span>
                <span className="text-[10px] font-semibold text-[var(--gl-accent)] font-mono">
                  {item.effectiveUnitPrice.toLocaleString("vi-VN")}₫
                </span>
                {item.promotionName && (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] text-[9px] font-bold font-mono">
                    {item.promotionName}
                  </span>
                )}
              </div>
              <span className="text-[var(--gl-accent)] font-mono block font-bold">
                {lineAmount.toLocaleString("vi-VN")}₫
              </span>
            </div>
          ) : (
            <span className="text-[var(--gl-accent)] font-mono font-bold block mt-0.5">
              {lineAmount.toLocaleString("vi-VN")}₫
            </span>
          )}
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
