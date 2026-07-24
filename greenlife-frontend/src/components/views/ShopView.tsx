import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, Leaf, Sparkles } from "lucide-react";
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
  const { loadProducts, currentUser, toggleWishlist, loading, stores, selectedStoreId } = useAppContext();
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("featured");

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const controller = new AbortController();
    loadProducts(debouncedSearch, selectedCategory, controller.signal);
    return () => {
      controller.abort();
    };
  }, [debouncedSearch, selectedCategory]);

  const matchedStore = useMemo(() => {
    return stores.find((s) => String(s.id) === String(selectedStoreId));
  }, [stores, selectedStoreId]);

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
    <div className="space-y-8 pb-20 text-[var(--gl-text-primary)]">
      {/* Header Info */}
      <div className="space-y-2">
        <span className="text-xs text-[var(--gl-accent)] font-mono tracking-widest uppercase font-semibold">KHÔNG GIAN MUA SẮM</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-[var(--gl-text-primary)] tracking-tight">Cửa Hàng Sinh Thái GreenLife</h1>
        <p className="text-[var(--gl-text-secondary)] text-sm max-w-2xl leading-relaxed">
          Nguồn cung cấp tuyển chọn sản phẩm dưỡng sinh thực vật lành tính. Đảm bảo quy chuẩn hữu cơ đóng gói sinh học cao cấp nhất tại Việt Nam.
        </p>
      </div>

      {/* Location & Store Selector */}
      <LocationSelector />

      {/* Control Panel: Search & Filters */}
      <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-5 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gl-text-muted)]" />
            <input
              type="text"
              placeholder="Tìm phân trùn quế, dầu neem, sen đá..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-[40px] bg-[var(--gl-bg-muted)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all placeholder:text-[var(--gl-text-muted)]"
            />
          </div>

          {/* Sorted Block */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <SlidersHorizontal className="h-4 w-4 text-[var(--gl-text-muted)] shrink-0" />
            <span className="text-xs text-[var(--gl-text-muted)] font-mono shrink-0">Sắp xếp:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="min-h-[40px] bg-[var(--gl-bg-muted)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] py-2 px-3.5 rounded-xl text-xs focus:outline-none cursor-pointer font-medium"
            >
              <option value="featured" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Nổi Bật Nhất</option>
              <option value="price-asc" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Giá: Thấp tới Cao</option>
              <option value="price-desc" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Giá: Cao xuống Thấp</option>
              <option value="rating" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Được Ưa Thích Nhất</option>
              <option value="eco" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Điểm Thân Thiện Eco</option>
            </select>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--gl-border)]">
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
        <div className="p-3 bg-[var(--gl-accent-soft)]/30 border border-[var(--gl-accent)]/20 rounded-xl text-[11px] text-[var(--gl-accent)] flex items-center gap-2">
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
