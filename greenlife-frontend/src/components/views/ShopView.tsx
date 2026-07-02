import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, Leaf, Sparkles, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Product } from "../../types";
import { useAppContext } from "../../context/AppContext";
import { LocationSelector } from "../ui/LocationSelector";
import { ProductGridSkeleton } from "../common/Skeleton";
import { ProductCard } from "../common/ProductCard";
import { CategoryCard } from "../common/CategoryCard";
import { useDebounce } from "../../hooks/useDebounce";
import { EmptyState } from "../common/EmptyState";


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
  const { userLocation, selectedStoreId, setSelectedStoreId, stores, loadProducts, currentUser, toggleWishlist, loading } = useAppContext();
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("featured");
  const [showMapSection, setShowMapSection] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const controller = new AbortController();
    loadProducts(debouncedSearch, selectedCategory, controller.signal);
    return () => {
      controller.abort();
    };
  }, [debouncedSearch, selectedCategory]);

  const handleAddToCart = useCallback((p: Product) => {
    onAddToCart(p);
  }, [onAddToCart]);

  const handleSelectProduct = useCallback((p: Product) => {
    onSelectProduct(p);
  }, [onSelectProduct]);

  const handleToggleWishlist = useCallback(async (id: number) => {
    await toggleWishlist(id);
  }, [toggleWishlist]);

  const handleCategoryChange = useCallback((id: string) => {
    setSelectedCategory(id as CategoryFilter);
  }, []);

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

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Apply Search Filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
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

    return result;
  }, [products, debouncedSearch, selectedCategory]);

  const sortedProducts = useMemo(() => {
    const result = [...filteredProducts];

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
  }, [filteredProducts, sortOption]);

  const paginatedProducts = useMemo(() => {
    return sortedProducts;
  }, [sortedProducts]);

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
            <CategoryCard
              key={cat.id}
              category={cat}
              isActive={selectedCategory === cat.id}
              onClick={handleCategoryChange}
            />
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
      {loading?.products ? (
        <ProductGridSkeleton count={6} />
      ) : paginatedProducts.length === 0 ? (
        <EmptyState
          icon={Leaf}
          title="Không tìm thấy sản phẩm"
          description="Không tìm thấy sản phẩm nào khớp với bộ lọc hoặc tìm kiếm của bạn."
          action={{
            label: "Reset bộ lọc",
            onClick: () => {
              setSearch("");
              setSelectedCategory("all");
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={handleSelectProduct}
              onAddToCart={handleAddToCart}
              toggleWishlist={handleToggleWishlist}
              isSaved={currentUser?.savedProductIds?.includes(String(product.id))}
              showDetailsStyle={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
