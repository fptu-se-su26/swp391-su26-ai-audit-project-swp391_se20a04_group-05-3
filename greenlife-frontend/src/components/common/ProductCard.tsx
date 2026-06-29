import React from "react";
import { Product } from "../../types";
import { Leaf, Heart } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onSelectProduct: (p: Product) => void;
  onAddToCart?: (p: Product) => void;
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
  if (showDetailsStyle) {
    return (
      <div className="group bg-stone-950 border border-stone-850 hover:border-emerald-900/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all">
        {/* Product Image Stage */}
        <div 
          className="relative h-60 bg-stone-900 overflow-hidden cursor-pointer"
          onClick={() => onSelectProduct(product)}
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-950/95 border border-emerald-500/30 font-mono text-[9px] text-emerald-400 flex items-center gap-1">
              <Leaf className="h-2.5 w-2.5" />
              ECO {product.ecoScore}%
            </span>
            {product.stock <= 5 && (
              <span className="px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500/30 font-mono text-[9px] text-amber-400">
                Chỉ còn {product.stock} sản phẩm
              </span>
            )}
          </div>
          {toggleWishlist && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await toggleWishlist(Number(product.id));
              }}
              className={`absolute top-3 right-3 p-2 rounded-xl border transition-all cursor-pointer z-10 ${
                isSaved
                  ? "bg-rose-950/65 border-rose-500 text-rose-500"
                  : "bg-stone-950/80 border-stone-800 text-stone-500 hover:text-rose-500"
              }`}
            >
              <Heart className="h-4 w-4 fill-current" />
            </button>
          )}
        </div>

        {/* Info & Buy Module */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block">
              {product.category === "plants" ? "Cây Xanh" : product.category === "care" ? "Chăm Sóc" : product.category === "nutrients" ? "Dinh Dưỡng" : "IoT Smart"}
            </span>
            <h3 
              onClick={() => onSelectProduct(product)}
              className="font-sans font-semibold text-stone-100 hover:text-emerald-400 transition-colors cursor-pointer text-base line-clamp-1"
            >
              {product.name}
            </h3>
            <p className="text-stone-400 text-xs line-clamp-2 leading-relaxed h-8">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-stone-850 pt-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-stone-500">Giá thành:</span>
              <span className="text-base font-bold text-emerald-400 font-mono leading-none mt-0.5">
                {product.price.toLocaleString("vi-VN")}₫
              </span>
            </div>

            {onAddToCart && (
              <button
                onClick={() => onAddToCart(product)}
                className="px-4 py-2 bg-stone-800 hover:bg-emerald-500 hover:text-black font-semibold text-xs text-stone-200 rounded-xl transition-all cursor-pointer"
              >
                Thêm vào giỏ
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
      className="group bg-stone-900/30 border border-stone-800 hover:border-stone-700 rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 shadow-sm"
    >
      {/* Product Image */}
      <div className="relative h-56 bg-stone-950 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-stone-900/95 border border-emerald-500/30 font-mono text-[10px] text-emerald-400">
          ECO {product.ecoScore}%
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5 space-y-3">
        <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">{product.category}</span>
        <h3 className="font-sans font-medium text-stone-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-emerald-400 font-mono">
            {product.price.toLocaleString("vi-VN")}₫
          </span>
          <span className="text-xs text-stone-400 bg-stone-800/40 px-2 py-0.5 rounded-md">
            ⭐ {product.rating}
          </span>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";
