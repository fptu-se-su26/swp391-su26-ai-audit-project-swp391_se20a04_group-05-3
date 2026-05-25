import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Leaf, Sparkles } from "lucide-react";
import { Product } from "../types";

interface ShopViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

type CategoryFilter = "all" | "plants" | "care" | "nutrients" | "smarthome";
type SortOption = "featured" | "price-asc" | "price-desc" | "rating" | "eco";

export const ShopView: React.FC<ShopViewProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("featured");

  const categories = [
    { id: "all", label: "Tất Cả" },
    { id: "plants", label: "Cây Xanh Bản Địa" },
    { id: "care", label: "Trị Bệnh Sinh Học" },
    { id: "nutrients", label: "Dinh Dưỡng Hữu Cơ" },
    { id: "smarthome", label: "IoT Smart Home" },
  ];

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Apply Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Apply Category Filter
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Apply Sort option
    if (sortOption === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === "eco") {
      result.sort((a, b) => b.ecoScore - a.ecoScore);
    }

    return result;
  }, [products, search, selectedCategory, sortOption]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header Info */}
      <div className="space-y-2">
        <span className="text-xs text-emerald-500 font-mono tracking-widest uppercase">KHÔNG GIAN MUA SẮM</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">Cửa Hàng Sinh Thái GreenLife</h1>
        <p className="text-stone-400 text-sm max-w-2xl leading-relaxed">
          Nguồn cung cấp tuyển chọn sản phẩm dưỡng sinh thực vật lành tính. Đảm bảo quy chuẩn hữu cơ đóng gói sinh học cao cấp nhất tại Việt Nam.
        </p>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="bg-stone-900/30 border border-stone-800 p-5 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <input
              type="text"
              placeholder="Tìm phân trùn quế, dầu neem, sen đá..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-950 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Sorted Block */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <SlidersHorizontal className="h-4 w-4 text-stone-500" />
            <span className="text-xs text-stone-400 font-mono">Sắp xếp:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-stone-950 text-stone-200 border border-stone-800 py-2 px-3.5 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="featured">Nổi Bật Nhất</option>
              <option value="price-asc">Giá: Thấp tới Cao</option>
              <option value="price-desc">Giá: Cao xuống Thấp</option>
              <option value="rating">Được Ưa Thích Nhất</option>
              <option value="eco">Điểm Thân Thiện Eco</option>
            </select>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-800/40">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as CategoryFilter)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                selectedCategory === cat.id
                  ? "bg-emerald-500 text-black shadow-md font-semibold"
                  : "bg-stone-950 text-stone-400 border border-stone-850 hover:text-stone-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-20 bg-stone-900/10 border border-dashed border-stone-800 rounded-3xl space-y-3">
          <p className="text-stone-400 font-medium">Không tìm thấy sản phẩm nào khớp với tìm kiếm.</p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
            }}
            className="text-xs text-emerald-400 hover:underline"
          >
            Reset bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProducts.map((product) => {
            return (
              <div
                key={product.id}
                className="group bg-[#151515] border border-[#252525] hover:border-emerald-900/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all"
              >
                {/* Product Image Stage */}
                <div 
                  className="relative h-60 bg-stone-950 overflow-hidden cursor-pointer"
                  onClick={() => onSelectProduct(product)}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
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

                  <div className="flex items-center justify-between border-t border-stone-800/40 pt-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-stone-500">Giá thành:</span>
                      <span className="text-base font-bold text-emerald-400 font-mono leading-none mt-0.5">
                        {product.price.toLocaleString("vi-VN")}₫
                      </span>
                    </div>

                    <button
                      onClick={() => onAddToCart(product)}
                      className="px-4 py-2 bg-stone-800 hover:bg-emerald-500 hover:text-black font-semibold text-xs text-stone-200 rounded-xl transition-all cursor-pointer"
                    >
                      Thống Thêm Giỏ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
