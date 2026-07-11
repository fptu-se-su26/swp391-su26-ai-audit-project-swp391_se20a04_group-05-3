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
    <div className="bg-stone-900/30 border border-stone-850 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <img
          src={getMediaUrl(item.product.image)}
          alt={item.product.name}
          className="w-12 h-12 object-cover rounded-xl"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="space-y-0.5">
          <span className="font-semibold text-white block line-clamp-1">{item.product.name}</span>
          <span className="text-emerald-400 font-mono block mt-0.5">
            {(item.product.price * item.quantity).toLocaleString("vi-VN")}₫
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Dec/Inc Quantity buttons */}
        <div className="flex items-center bg-stone-950 border border-stone-850 rounded-lg">
          <button
            onClick={() => onUpdateQuantity(item.product.id, -1)}
            className="px-2 py-1 text-stone-500 hover:text-white cursor-pointer"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="px-2 text-[11px] text-white font-mono">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.product.id, 1)}
            className="px-2 py-1 text-stone-500 hover:text-white cursor-pointer"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <button
          onClick={() => onRemove(item.product.id)}
          className="p-1.5 text-stone-500 hover:text-rose-450 transition-colors cursor-pointer"
          title="Xóa khỏi giỏ"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

CartItemRow.displayName = "CartItemRow";
