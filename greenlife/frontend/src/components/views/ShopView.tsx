import React, { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, Leaf, Sparkles, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Product } from "../../types";
import { useAppContext } from "../../context/AppContext";
import { LocationSelector } from "../ui/LocationSelector";


interface ShopViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  initialSearch?: string;
}

type CategoryFilter = "all" | "plants" | "care" | "nutrients" | "smarthome";
type SortOption = "featured" | "price-asc" | "price-desc" | "rating" | "eco";

export const ShopView: React.FC<ShopViewProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  initialSearch = "",
}) => {
  const { userLocation, selectedStoreId, setSelectedStoreId, stores } = useAppContext();
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("featured");
  const [showMapSection, setShowMapSection] = useState(false);

  const categories = [
    { id: "all", label: "Tất Cả" },
    { id: "plants", label: "Cây Xanh Bản Địa" },
    { id: "care", label: "Trị Bệnh Sinh Học" },
    { id: "nutrients", label: "Dinh Dưỡng Hữu Cơ" },
    { id: "smarthome", label: "IoT Smart Home" },
  ];

  const cityStores = useMemo(() => {
    return stores.filter((s) => s.city === userLocation.city);
  }, [stores, userLocation.city]);

  const matchedStore = useMemo(() => {
    return stores.find((s) => s.id === selectedStoreId);
  }, [stores, selectedStoreId]);

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
    <div className="space-y-8 pb-20 text-stone-100">
      {/* Header Info */}
      <div className="space-y-2">
        <span className="text-xs text-emerald-500 font-mono tracking-widest uppercase font-semibold">KHÔNG GIAN MUA SẮM</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-100 tracking-tight">Cửa Hàng Sinh Thái GreenLife</h1>
        <p className="text-stone-400 text-sm max-w-2xl leading-relaxed">
          Nguồn cung cấp tuyển chọn sản phẩm dưỡng sinh thực vật lành tính. Đảm bảo quy chuẩn hữu cơ đóng gói sinh học cao cấp nhất tại Việt Nam.
        </p>
      </div>

      {/* Persistent Selected Location Widget bar */}
      <div className="bg-stone-950 border border-stone-850 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/20 text-emerald-400 shadow-sm shadow-black">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-stone-500 font-mono block">VỊ TRÍ & ĐỊA ĐIỂM GIAO HÀNG:</span>
            <p className="text-xs text-stone-200 font-semibold leading-normal">
              {userLocation.address}
            </p>
            {matchedStore ? (
              <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                Cung cấp bởi đối tác: <strong className="font-semibold text-emerald-400">{matchedStore.name}</strong> ({matchedStore.address})
              </p>
            ) : (
              <p className="text-[11px] text-amber-500 font-medium mt-0.5">
                Chưa chọn nhà vườn cung ứng. Vui lòng bấm nút bên để thiết lập!
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowMapSection(!showMapSection)}
          className="w-full sm:w-auto px-4 py-2.5 bg-stone-800 hover:bg-stone-750 border border-stone-700 text-xs font-semibold rounded-xl text-stone-300 hover:text-stone-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Thay đổi địa chỉ & nhà vườn</span>
          {showMapSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Collapsible Location Selector Drawer */}
      {showMapSection && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Location details card */}
          <div className="lg:col-span-6 space-y-4">
            <LocationSelector />
          </div>

          {/* Stores list */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-3 h-full flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-xs text-stone-200 uppercase font-mono tracking-wider">
                  Nhà vườn tại {userLocation.city} ({cityStores.length})
                </h4>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  Chọn nhà vườn gần bạn nhất để tối ưu phí vận chuyển
                </p>
                
                {cityStores.length === 0 ? (
                  <p className="text-xs text-stone-500 py-6 text-center">Không có nhà vườn nào trong thành phố này.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 mt-3">
                    {cityStores.map((store) => {
                      const isSelected = selectedStoreId === store.id;
                      return (
                        <div
                          key={store.id}
                          onClick={() => setSelectedStoreId(store.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-950/25 text-emerald-400"
                              : "border-stone-805 bg-stone-900/40 hover:border-stone-800 hover:bg-stone-900 text-stone-300"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold leading-snug">{store.name}</h5>
                              <p className="text-[10px] text-stone-400 line-clamp-1">{store.address}</p>
                              <p className="text-[9px] text-stone-500 font-mono">
                                Khu giao: <span className="text-emerald-500">{store.serviceArea || "Mọi quận huyện"}</span>
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold shrink-0 ${
                              isSelected
                                ? "bg-emerald-500 text-black"
                                : "bg-stone-800 text-stone-400"
                            }`}>
                              {isSelected ? "ĐANG CHỌN" : "CHỌN"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel: Search & Filters */}
      <div className="bg-stone-950 border border-stone-850 p-5 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <input
              type="text"
              placeholder="Tìm phân trùn quế, dầu neem, sen đá..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
            />
          </div>

          {/* Sorted Block */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <SlidersHorizontal className="h-4 w-4 text-stone-500" />
            <span className="text-xs text-stone-400 font-mono">Sắp xếp:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-stone-900 text-stone-200 border border-stone-800 py-2 px-3.5 rounded-xl text-xs focus:outline-none"
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
        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-850">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as CategoryFilter)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                selectedCategory === cat.id
                  ? "bg-emerald-500 text-black shadow-md font-semibold"
                  : "bg-stone-900 text-stone-400 border border-stone-850 hover:text-stone-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected store products warning banner */}
      {matchedStore && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>Bạn đang xem các sản phẩm sinh học được tối ưu giao nhanh từ chi nhánh <strong>{matchedStore.name}</strong>.</span>
        </div>
      )}

      {/* Products Grid */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-20 bg-stone-950/50 border border-dashed border-stone-850 rounded-3xl space-y-3">
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
                className="group bg-stone-950 border border-stone-850 hover:border-emerald-900/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all"
              >
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

                  <div className="flex items-center justify-between border-t border-stone-850 pt-3">
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
                      Thêm vào giỏ
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
