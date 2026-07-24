import React, { useState } from "react";
import { Product } from "../../types";
import { Leaf, Heart, Sprout } from "lucide-react";
import { getMediaUrl } from "../../utils/mediaUrl";

interface ProductCardProps {
  product: Product;
  onSelectProduct: (p: Product) => void;
  onAddToCart?: (p: Product, quantity?: number, event?: React.MouseEvent) => void;
  toggleWishlist?: (id: number) => Promise<void>;
  isSaved?: boolean;
  showDetailsStyle?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  onSelectProduct,
  onAddToCart,
  toggleWishlist,
  isSaved = false,
  showDetailsStyle = false
}) => {
  const [imgError, setImgError] = useState(false);

  if (showDetailsStyle) {
    return (
      <div className="gl-border-beam group bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all duration-300">
        {/* Product Image Stage */}
        <div 
          className="relative h-60 bg-[var(--gl-bg-muted)] overflow-hidden cursor-pointer"
          onClick={() => onSelectProduct(product)}
        >
          {imgError || !product.image ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--gl-text-muted)] bg-[var(--gl-bg-muted)] p-4 text-center">
              <Sprout className="w-10 h-10 mb-1 opacity-60 text-[var(--gl-accent)]" />
              <span className="text-[10px] font-mono">{product.name}</span>
            </div>
          ) : (
            <img
              src={getMediaUrl(product.image)}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          )}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
            <span className="px-2 py-0.5 rounded bg-[var(--gl-bg-surface)]/95 border border-[var(--gl-accent)]/30 font-mono text-[9px] text-[var(--gl-accent)] flex items-center gap-1 shrink-0 shadow-sm">
              <Leaf className="h-2.5 w-2.5" />
              ECO {product.ecoScore}%
            </span>
            {product.stock <= 0 ? (
              <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 font-mono text-[9px] text-[var(--gl-danger)] font-bold uppercase shrink-0">
                Hết hàng
              </span>
            ) : product.stock <= 10 ? (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 font-mono text-[9px] text-amber-500 dark:text-amber-400 font-bold uppercase shrink-0">
                Sắp hết ({product.stock})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 font-mono text-[9px] text-[var(--gl-accent)] font-bold uppercase shrink-0">
                Còn hàng
              </span>
            )}
            {product.isBestSeller && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 font-mono text-[9px] text-amber-600 dark:text-amber-300 font-bold uppercase shrink-0">
                🔥 Bán chạy
              </span>
            )}
            {product.onSale && (
              <span className="px-2 py-0.5 rounded bg-[var(--gl-accent)] text-white dark:text-emerald-950 font-mono text-[8px] font-extrabold uppercase shrink-0">
                🏷️ SALE
              </span>
            )}
          </div>
          {toggleWishlist && (
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                await toggleWishlist(Number(product.id));
              }}
              className={`absolute top-3 right-3 min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
                isSaved
                  ? "bg-rose-500/15 border-rose-500 text-[var(--gl-danger)]"
                  : "bg-[var(--gl-bg-surface)]/80 border-[var(--gl-border)] text-[var(--gl-text-muted)] hover:text-[var(--gl-danger)]"
              }`}
              aria-label={isSaved ? `Bỏ lưu ${product.name}` : `Lưu ${product.name} vào yêu thích`}
            >
              <Heart className="h-4 w-4 fill-current" />
            </button>
          )}
        </div>

        {/* Info & Buy Module */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-[var(--gl-text-muted)] uppercase tracking-widest block">
              {product.category === "plants" ? "Cây Xanh" : product.category === "care" ? "Chăm Sóc" : product.category === "nutrients" ? "Dinh Dưỡng" : "IoT Smart"}
            </span>
            <h3 
              onClick={() => onSelectProduct(product)}
              className="font-sans font-semibold text-[var(--gl-text-primary)] hover:text-[var(--gl-accent)] transition-colors cursor-pointer text-base line-clamp-1"
            >
              {product.name}
            </h3>
            <p className="text-[var(--gl-text-secondary)] text-xs line-clamp-2 leading-relaxed h-8">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--gl-border-subtle)] pt-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-[var(--gl-text-muted)]">Giá thành:</span>
              {product.onSale && product.effectivePrice !== undefined ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[var(--gl-text-muted)] line-through font-mono">
                      {product.price.toLocaleString("vi-VN")}₫
                    </span>
                    {product.promotionName && (
                      <span className="px-1.5 py-0.2 rounded bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] text-[8px] font-bold font-mono">
                        {product.promotionName}
                      </span>
                    )}
                  </div>
                  <span className="text-base font-bold text-[var(--gl-accent)] font-mono leading-none">
                    {product.effectivePrice.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              ) : (
                <span className="text-base font-bold text-[var(--gl-accent)] font-mono leading-none mt-0.5">
                  {product.price.toLocaleString("vi-VN")}₫
                </span>
              )}
            </div>

            {onAddToCart && (
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={(e) => onAddToCart(product, 1, e)}
                className={`min-h-[40px] px-4 py-2 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
                  product.stock <= 0
                    ? "bg-[var(--gl-bg-muted)] text-[var(--gl-text-muted)] border border-[var(--gl-border)] cursor-not-allowed opacity-50"
                    : "bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 shadow-sm"
                }`}
                aria-label={`Thêm ${product.name} vào giỏ hàng`}
              >
                {product.stock <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Simplified style for home view
  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="gl-border-beam group bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between"
    >
      {/* Product Image */}
      <div className="relative h-56 bg-[var(--gl-bg-muted)] overflow-hidden">
        {imgError || !product.image ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--gl-text-muted)] bg-[var(--gl-bg-muted)] p-4 text-center">
            <Sprout className="w-10 h-10 mb-1 opacity-60 text-[var(--gl-accent)]" />
            <span className="text-[10px] font-mono">{product.name}</span>
          </div>
        ) : (
          <img
            src={getMediaUrl(product.image)}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
          <span className="px-2 py-0.5 rounded bg-[var(--gl-bg-surface)]/95 border border-[var(--gl-accent)]/30 font-mono text-[9px] text-[var(--gl-accent)] flex items-center gap-1 shrink-0 shadow-sm">
            <Leaf className="h-2.5 w-2.5" />
            ECO {product.ecoScore}%
          </span>
          {product.stock <= 0 ? (
            <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 font-mono text-[9px] text-[var(--gl-danger)] font-bold uppercase shrink-0">
              Hết hàng
            </span>
          ) : product.stock <= 10 ? (
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 font-mono text-[9px] text-amber-500 dark:text-amber-400 font-bold uppercase shrink-0">
              Sắp hết ({product.stock})
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 font-mono text-[9px] text-[var(--gl-accent)] font-bold uppercase shrink-0">
              Còn hàng
            </span>
          )}
          {product.isBestSeller && (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 font-mono text-[9px] text-amber-600 dark:text-amber-300 font-bold uppercase shrink-0">
              🔥 Bán chạy
            </span>
          )}
          {product.onSale && (
            <span className="px-2 py-0.5 rounded bg-[var(--gl-accent)] text-white dark:text-emerald-950 font-mono text-[8px] font-extrabold uppercase shrink-0">
              🏷️ SALE
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5 space-y-3">
        <span className="text-[10px] font-mono text-[var(--gl-text-muted)] uppercase tracking-widest">{product.category}</span>
        <h3 className="font-sans font-medium text-[var(--gl-text-primary)] group-hover:text-[var(--gl-accent)] transition-colors line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          {product.onSale && product.effectivePrice !== undefined ? (
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--gl-text-muted)] line-through font-mono leading-none">
                {product.price.toLocaleString("vi-VN")}₫
              </span>
              <span className="text-base font-semibold text-[var(--gl-accent)] font-mono mt-0.5 leading-none">
                {product.effectivePrice.toLocaleString("vi-VN")}₫
              </span>
            </div>
          ) : (
            <span className="text-base font-semibold text-[var(--gl-accent)] font-mono leading-none">
              {product.price.toLocaleString("vi-VN")}₫
            </span>
          )}
          <span className="text-xs text-[var(--gl-text-secondary)] bg-[var(--gl-bg-muted)] px-2 py-0.5 rounded-md border border-[var(--gl-border-subtle)]">
            ⭐ {product.rating}
          </span>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";
