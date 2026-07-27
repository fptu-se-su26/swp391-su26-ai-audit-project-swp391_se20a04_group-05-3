import React, { useState, useEffect, useMemo, useCallback } from "react";
import { logger } from "../../utils/logger";
import { ArrowLeft, Leaf, ShieldCheck, Heart, ShoppingBag, MessageSquare, Star, X } from "lucide-react";
import { Product } from "../../types";
import { getMediaUrl } from "../../utils/mediaUrl";
import { PlantService } from "../../services/plantService";
import { WishlistService } from "../../services/wishlistService";
import { ReviewService, ReviewResponse, RatingSummaryResponse } from "../../services/reviewService";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { ListSkeleton } from "../common/Skeleton";
import { ReviewCard } from "../common/ReviewCard";
import { EmptyState } from "../common/EmptyState";
import { ConfirmModal } from "../common/ConfirmModal";

interface ProductDetailViewProps {
  product: Product;
  onBackToShop: () => void;
  onAddToCart: (product: Product, quantity: number, event?: React.MouseEvent) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product: incomingProduct,
  onBackToShop,
  onAddToCart,
}) => {
  const [localProduct, setLocalProduct] = useState<Product>(incomingProduct);

  useEffect(() => {
    setLocalProduct(incomingProduct);
  }, [incomingProduct]);

  useEffect(() => {
    let active = true;
    const fetchLatestDetails = async () => {
      try {
        const fresh = await PlantService.getProductById(incomingProduct.id);
        if (active) {
          setLocalProduct(fresh);
        }
      } catch (err) {
        logger.warn("Lỗi đồng bộ chi tiết sản phẩm:", err);
      }
    };
    fetchLatestDetails();
    return () => {
      active = false;
    };
  }, [incomingProduct.id]);

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setPotOption("classic-clay");
    setSoilAddon(false);
    setIsLiked(false);
    setImageError(false);
    setReviews([]);
    setLoadingReviews(true);
    setReviewPage(0);
    setTotalPages(0);
    setTotalElements(0);
    setRatingSummary({ averageRating: 5.0, totalReviews: 0 });
    setSelectedFilter("all");
  }, [incomingProduct.id]);

  const product = localProduct;
  const [quantity, setQuantity] = useState(1);
  const [potOption, setPotOption] = useState("classic-clay");
  const [soilAddon, setSoilAddon] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [deleteReviewOpen, setDeleteReviewOpen] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const checkLikedStatus = async () => {
      try {
        const liked = await WishlistService.checkWishlist(Number(product.id), controller.signal);
        setIsLiked(liked);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          logger.warn("Lỗi kiểm tra trạng thái yêu thích:", err);
        }
      }
    };
    checkLikedStatus();
    return () => {
      controller.abort();
    };
  }, [product.id]);

  const { currentUser, createReview, updateReview, deleteReview } = useAppContext();

  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewPage, setReviewPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [ratingSummary, setRatingSummary] = useState<RatingSummaryResponse>({ averageRating: 5.0, totalReviews: 0 });
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Write Review Modal states
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [writeError, setWriteError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Edit Review Modal states
  const [editingReview, setEditingReview] = useState<ReviewResponse | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editError, setEditError] = useState("");
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);

  const loadReviewsAndSummary = useCallback(async (signal?: AbortSignal) => {
    setLoadingReviews(true);
    try {
      const summaryData = await ReviewService.getPlantRatingSummary(Number(product.id), signal);
      setRatingSummary(summaryData);

      const paginatedData = await ReviewService.getProductReviews(Number(product.id), reviewPage, 6, signal);
      setReviews(paginatedData.content);
      setTotalPages(paginatedData.totalPages);
      setTotalElements(paginatedData.totalElements);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        logger.error("Lỗi tải đánh giá sản phẩm:", err);
      }
    } finally {
      setLoadingReviews(false);
    }
  }, [product.id, reviewPage]);

  useEffect(() => {
    const controller = new AbortController();
    loadReviewsAndSummary(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadReviewsAndSummary]);

  const averageRating = useMemo(() => {
    return ratingSummary.totalReviews === 0
      ? String(product.rating || 5.0)
      : ratingSummary.averageRating.toFixed(1);
  }, [ratingSummary, product.rating]);

  const anonymizeName = useCallback((name: string) => {
    if (!name) return "k***g";
    const trimmed = name.trim();
    if (trimmed.length <= 2) return trimmed.toLowerCase() + "***";
    const parts = trimmed.split(" ");
    const lastName = parts[parts.length - 1];
    const firstChar = trimmed[0].toLowerCase();
    const lastChar = lastName[lastName.length - 1].toLowerCase();
    return `${firstChar}***${lastChar}`;
  }, []);

  const handleOpenWriteModal = useCallback(() => {
    setNewRating(5);
    setNewComment("");
    setWriteError("");
    setIsWriteModalOpen(true);
  }, []);

  const handleCreateReviewSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setWriteError("");
    setIsSubmittingReview(true);
    try {
      await createReview({
        plantId: Number(product.id),
        rating: newRating,
        comment: newComment
      });
      setIsWriteModalOpen(false);
      setReviewPage(0);
      loadReviewsAndSummary();
    } catch (err: any) {
      setWriteError(err.message || "Không thể gửi đánh giá.");
    } finally {
      setIsSubmittingReview(false);
    }
  }, [createReview, product.id, newRating, newComment, loadReviewsAndSummary]);

  const handleOpenEditModal = useCallback((rev: ReviewResponse) => {
    setEditingReview(rev);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
    setEditError("");
  }, []);

  const handleUpdateReviewSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setEditError("");
    setIsUpdatingReview(true);
    try {
      await updateReview(editingReview.id, {
        rating: editRating,
        comment: editComment
      });
      setEditingReview(null);
      loadReviewsAndSummary();
    } catch (err: any) {
      setEditError(err.message || "Không thể cập nhật đánh giá.");
    } finally {
      setIsUpdatingReview(false);
    }
  }, [editingReview, editRating, editComment, updateReview, loadReviewsAndSummary]);

  const handleDeleteReview = useCallback((id: number) => {
    setDeleteReviewId(id);
    setDeleteReviewOpen(true);
  }, []);

  const handleDeleteReviewConfirmed = useCallback(async () => {
    if (!deleteReviewId) return;
    setDeleteReviewOpen(false);
    try {
      await deleteReview(deleteReviewId);
      setReviewPage(0);
      loadReviewsAndSummary();
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa đánh giá.");
    } finally {
      setDeleteReviewId(null);
    }
  }, [deleteReviewId, deleteReview, loadReviewsAndSummary]);

  const handlePageChange = useCallback((newPage: number) => {
    setReviewPage(newPage);
  }, []);

  const stockBadgeInfo = useMemo(() => {
    if (product.stock <= 0) {
      return { text: "Hết hàng", classes: "bg-rose-500/10 text-rose-500 border border-rose-500/20" };
    }
    if (product.stock <= 10) {
      return { text: "Sắp hết hàng", classes: "bg-amber-500/10 text-amber-500 border border-amber-500/20" };
    }
    return { text: "Còn hàng", classes: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
  }, [product.stock]);

  const specEntries = useMemo(() => {
    return Object.entries(product.specs || {});
  }, [product.specs]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(f => {
      if (selectedFilter === "all") return true;
      return f.rating === parseInt(selectedFilter, 10);
    });
  }, [reviews, selectedFilter]);


  return (
    <div className="space-y-8 pb-20 text-[var(--gl-text-primary)]">
      {/* Back to Catalog trigger */}
      <button
        type="button"
        onClick={onBackToShop}
        className="inline-flex items-center gap-2 min-h-[40px] px-3 py-1.5 text-sm text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] transition-colors cursor-pointer font-medium rounded-xl hover:bg-[var(--gl-bg-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại tất cả sản phẩm
      </button>

      {/* Main Structural Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Columns - Image Presentation */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-3xl overflow-hidden shadow-xl flex items-center justify-center">
            {imageError || !product.image ? (
              <div className="flex flex-col items-center justify-center text-[var(--gl-text-muted)] p-6 text-center space-y-2">
                <Leaf className="w-12 h-12 stroke-[1.5] text-[var(--gl-text-muted)] animate-pulse" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider">Hình ảnh sinh học</span>
                <span className="text-[10px] text-[var(--gl-text-muted)] max-w-[200px] leading-relaxed">Đang cập nhật hình ảnh chụp thực tế tại vườn ươm Lâm Đồng</span>
              </div>
            ) : (
              <img
                src={getMediaUrl(product.image)}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            )}
            <div className="absolute top-4 left-4 bg-[var(--gl-accent-soft)]/90 backdrop-blur-xs border border-[var(--gl-accent)]/30 text-[var(--gl-accent)] font-mono text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm font-bold">
              <Leaf className="h-4 w-4" />
              Chỉ số Thân Thiện: {product.ecoScore}%
            </div>
          </div>

          {/* Premium Ecology Commitment Card */}
          <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-5 rounded-2xl space-y-3 shadow-sm">
            <h4 className="text-xs text-[var(--gl-text-muted)] font-mono uppercase tracking-widest flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4 text-[var(--gl-accent)]" />
              BẢO CHỨNG SINH THÁI CO₂
            </h4>
            <p className="text-[var(--gl-text-secondary)] text-xs leading-relaxed">
              Mỗi đơn hàng sản phẩm {product.name} đã được trung hòa hoàn toàn dấu chân Carbon từ vùng nguyên liệu gieo ươm Lâm Đồng về tới nội đô nhờ quy cách đóng gói sinh học.
            </p>
          </div>
        </div>

        {/* Right Columns - Details, Pricing & Customization controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-xs text-[var(--gl-accent)] font-mono tracking-widest uppercase font-bold">{product.category}</span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[var(--gl-text-primary)] tracking-tight">{product.name}</h1>
            
            {/* Rating Stars and stock count */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-1 bg-[var(--gl-bg-surface)] px-3 py-1.5 rounded-xl text-[var(--gl-text-primary)] text-sm border border-[var(--gl-border)] shadow-xs">
                <span>⭐</span>
                <span className="font-mono font-semibold">{product.rating}</span>
              </div>
              <span className="text-xs font-mono text-[var(--gl-text-muted)]">|</span>
              <span className={`text-xs font-mono px-3 py-1.5 rounded-xl font-bold uppercase ${stockBadgeInfo.classes}`}>
                {stockBadgeInfo.text} {product.stock > 0 ? `(${product.stock})` : ""}
              </span>
              {product.isBestSeller && (
                <span className="text-xs font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold uppercase flex items-center gap-1.5 animate-pulse">
                  🔥 Bán chạy
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-b border-[var(--gl-border)] py-4">
            <span className="text-[10px] font-mono text-[var(--gl-text-muted)] block font-bold uppercase tracking-wider">Giá sản phẩm:</span>
            {product.onSale && product.effectivePrice !== undefined ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--gl-text-muted)] line-through font-mono">
                    {product.price.toLocaleString("vi-VN")}₫
                  </span>
                  {product.promotionName && (
                    <span className="px-2 py-0.5 rounded bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] text-xs font-bold font-mono">
                      Khuyến mãi: {product.promotionName}
                    </span>
                  )}
                </div>
                <span className="text-3xl font-extrabold font-mono text-[var(--gl-accent)] block">
                  {product.effectivePrice.toLocaleString("vi-VN")}₫
                </span>
              </div>
            ) : (
              <span className="text-3xl font-extrabold font-mono text-[var(--gl-accent)] block mt-1">
                {product.price.toLocaleString("vi-VN")}₫
              </span>
            )}
          </div>

          <p className="text-[var(--gl-text-secondary)] text-sm leading-relaxed">
            {product.description}
          </p>

          {/* Interactive Custom Setup: Pottery Pot & Extra Organic Addon */}
          <div className="space-y-4 pt-2">
            {/* Custom Pot Selector */}
            {product.category === "plants" && (
              <div className="space-y-2">
                <label className="text-xs text-[var(--gl-text-muted)] font-mono block font-semibold uppercase tracking-wider">Lựa chọn chậu đất gốm tinh xảo:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "classic-clay", label: "Đất nung bản địa (Hữu cơ)", desc: "Màu gạch đỏ tự dưỡng hơi ẩm" },
                    { id: "bat-trang-glaze", label: "Men độc bản Bát Tràng (+30k)", desc: "Gốm nung mộc cao tịnh chảy men" }
                  ].map((pot) => {
                    const isSelected = potOption === pot.id;
                    return (
                      <div
                        key={pot.id}
                        onClick={() => setPotOption(pot.id)}
                        className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all select-none min-h-[44px] ${
                          isSelected
                            ? "border-[var(--gl-accent)] bg-[var(--gl-accent-soft)]/30 text-[var(--gl-accent)]"
                            : "border-[var(--gl-border)] bg-[var(--gl-bg-surface)] hover:border-[var(--gl-border-subtle)] text-[var(--gl-text-secondary)]"
                        }`}
                      >
                        <h5 className={`text-xs font-semibold ${isSelected ? "text-[var(--gl-accent)]" : "text-[var(--gl-text-primary)]"}`}>{pot.label}</h5>
                        <span className="text-[10px] text-[var(--gl-text-muted)] mt-1 block leading-normal">{pot.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Specialized Substrate Matching Toggle */}
            <div className="space-y-2">
              <label className="text-xs text-[var(--gl-text-muted)] font-mono block font-semibold uppercase tracking-wider">Tiện ích tối ưu sinh thái:</label>
              <div
                onClick={() => setSoilAddon(!soilAddon)}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all select-none min-h-[44px] ${
                  soilAddon
                    ? "border-[var(--gl-accent)] bg-[var(--gl-accent-soft)]/30"
                    : "border-[var(--gl-border)] bg-[var(--gl-bg-surface)] hover:border-[var(--gl-border-subtle)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={soilAddon}
                    readOnly
                    className="w-4 h-4 rounded border-[var(--gl-border)] bg-[var(--gl-bg-muted)] text-[var(--gl-accent)] focus:ring-[var(--gl-focus-ring)] cursor-pointer"
                  />
                  <div>
                    <span className={`text-xs font-semibold ${soilAddon ? "text-[var(--gl-accent)]" : "text-[var(--gl-text-primary)]"}`}>Bổ sung Phân Trùn Quế bón gốc (+35.000đ)</span>
                    <p className="text-[10px] text-[var(--gl-text-muted)] mt-0.5">Giúp rễ phát triển thần tốc chống thối nhũn ban đầu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quantity selector & Add to cart trigger */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[var(--gl-border)]">
            <div className="flex items-center bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl overflow-hidden">
              <button
                type="button"
                aria-label="Giảm số lượng"
                disabled={product.stock <= 0}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-[var(--gl-bg-elevated)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] transition-colors font-semibold text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
              >
                -
              </button>
              <span className="px-4 py-2 font-mono text-[var(--gl-text-primary)] text-sm font-bold select-none min-w-[30px] text-center">{quantity}</span>
              <button
                type="button"
                aria-label="Tăng số lượng"
                disabled={product.stock <= 0}
                onClick={() => setQuantity(quantity + 1)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-[var(--gl-bg-elevated)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] transition-colors font-semibold text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={(e) => {
                let finalProduct = { ...product };
                if (soilAddon) {
                  finalProduct.price += 35000;
                  if (finalProduct.effectivePrice !== undefined) {
                    finalProduct.effectivePrice += 35000;
                  }
                  finalProduct.name += " (Kèm Phân trùn quế)";
                }
                onAddToCart(finalProduct, quantity, e);
              }}
              className={`flex-1 md:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-8 py-3 font-semibold rounded-xl tracking-tight transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
                product.stock <= 0
                  ? "bg-[var(--gl-bg-muted)] text-[var(--gl-text-muted)] cursor-not-allowed opacity-60"
                  : "bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-bold shadow-sm active:scale-95"
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              {product.stock <= 0 ? "Hết Hàng Lâm Thời" : "Thêm Vào Giỏ Hàng"}
            </button>

            <button
              type="button"
              aria-label="Lưu sản phẩm yêu thích"
              onClick={async () => {
                try {
                  if (isLiked) {
                    await WishlistService.removeWishlist(Number(product.id));
                    setIsLiked(false);
                  } else {
                    await WishlistService.addWishlist(Number(product.id));
                    setIsLiked(true);
                  }
                } catch (err: any) {
                  toast.error("Vui lòng đăng nhập để lưu sản phẩm yêu thích.");
                }
              }}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
                isLiked
                  ? "bg-rose-500/10 border-rose-500 text-rose-500"
                  : "bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] text-[var(--gl-text-muted)] hover:text-rose-500 cursor-pointer"
              }`}
            >
              <Heart className="h-5 w-5 fill-current" />
            </button>
          </div>

          {/* Product Specifications & Logistics FAQ Tab */}
          <div className="pt-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--gl-text-primary)] border-b border-[var(--gl-border)] pb-2">Thông Số Kỹ Thuật Sinh Thái</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              {specEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between p-3 bg-[var(--gl-bg-surface)] rounded-xl border border-[var(--gl-border)] shadow-xs">
                  <span className="text-[var(--gl-text-secondary)] font-semibold">{key}:</span>
                  <span className="text-[var(--gl-text-primary)] font-bold text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Reviews */}
          <div className="pt-8 space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--gl-border)] pb-3">
              <h3 className="text-base font-bold tracking-tight text-[var(--gl-text-primary)] flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-[var(--gl-accent)]" />
                Đánh Giá Từ Khách Hàng ({ratingSummary.totalReviews})
              </h3>
              {currentUser && (
                <button
                  type="button"
                  onClick={handleOpenWriteModal}
                  className="px-4 py-2 min-h-[40px] bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Viết Đánh Giá
                </button>
              )}
            </div>

            {/* Shopee-style Rating Dashboard */}
            <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-sm">
              <div className="md:col-span-4 text-center md:border-r border-[var(--gl-border)] pr-0 md:pr-6 space-y-1">
                <div className="text-3xl font-extrabold text-[var(--gl-accent)] font-mono">
                  {averageRating} <span className="text-sm font-normal text-[var(--gl-text-muted)]">/ 5</span>
                </div>
                <div className="flex justify-center gap-1 pt-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= Math.round(Number(averageRating));
                    return <Star key={star} className={`w-4 h-4 ${active ? "text-amber-400 fill-current" : "text-[var(--gl-text-muted)]"}`} />;
                  })}
                </div>
                <p className="text-[10px] text-[var(--gl-text-muted)] font-mono font-bold uppercase tracking-wider">Điểm Đánh Giá Trung Bình</p>
              </div>
              
              <div className="md:col-span-8 flex flex-wrap gap-2">
                {[
                  { id: "all", label: `Tất cả (${totalElements})` },
                  { id: "5", label: "5 Sao" },
                  { id: "4", label: "4 Sao" },
                  { id: "3", label: "3 Sao" },
                  { id: "2", label: "2 Sao" },
                  { id: "1", label: "1 Sao" }
                ].map((fTab) => (
                  <button
                    type="button"
                    key={fTab.id}
                    onClick={() => {
                      setSelectedFilter(fTab.id);
                      setReviewPage(0);
                    }}
                    className={`px-4 py-2 min-h-[40px] text-xs font-semibold rounded-xl border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
                      selectedFilter === fTab.id
                        ? "bg-[var(--gl-accent)] border-[var(--gl-accent)] text-white dark:text-emerald-950 shadow-sm font-bold"
                        : "bg-[var(--gl-bg-surface)] border-[var(--gl-border)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)]"
                    }`}
                  >
                    {fTab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Reviews List */}
            <div className="space-y-4">
              {loadingReviews ? (
                <ListSkeleton count={3} />
              ) : filteredReviews.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="Chưa có đánh giá"
                  description="Chưa có đánh giá nào phù hợp trên trang này."
                />
              ) : (
                filteredReviews.map((rev) => (
                  <ReviewCard
                    key={rev.id}
                    review={rev}
                    currentUser={currentUser}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteReview}
                    anonymize={true}
                    themeStyle="detail"
                  />
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={reviewPage === 0}
                  onClick={() => handlePageChange(reviewPage - 1)}
                  className="px-3 py-1.5 min-w-[40px] min-h-[40px] rounded-xl border border-[var(--gl-border)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)] disabled:opacity-50 text-xs font-mono transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Trước
                </button>
                <span className="text-xs text-[var(--gl-text-muted)] font-mono">
                  Trang {reviewPage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={reviewPage === totalPages - 1}
                  onClick={() => handlePageChange(reviewPage + 1)}
                  className="px-3 py-1.5 min-w-[40px] min-h-[40px] rounded-xl border border-[var(--gl-border)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)] disabled:opacity-50 text-xs font-mono transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Sau
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Write Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] w-full max-w-md max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--gl-border)] pb-3">
              <h3 className="text-sm font-bold text-[var(--gl-text-primary)] uppercase tracking-wider">Viết Đánh Giá Sản Phẩm</h3>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                aria-label="Đóng cửa sổ"
                className="text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-[var(--gl-bg-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateReviewSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[var(--gl-text-secondary)] block font-semibold">Chọn Số Sao *</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`${star} sao`}
                      onClick={() => setNewRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-lg"
                    >
                      <Star className={`w-6 h-6 ${star <= newRating ? "text-amber-400 fill-current" : "text-[var(--gl-text-muted)]"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--gl-text-secondary)] block font-semibold">Bình luận *</label>
                <textarea
                  required
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                  className="w-full p-3.5 rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] transition-all text-xs"
                />
              </div>

              {writeError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-[var(--gl-danger)] rounded-lg text-[11px] leading-relaxed">
                  {writeError}
                </div>
              )}

              <div className="flex gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="flex-1 min-h-[44px] py-2.5 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] hover:bg-[var(--gl-bg-elevated)] text-[var(--gl-text-primary)] rounded-xl font-bold uppercase cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 min-h-[44px] py-2.5 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 rounded-xl font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  {isSubmittingReview ? "Đang gửi..." : "Gửi Đánh Giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] w-full max-w-md max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--gl-border)] pb-3">
              <h3 className="text-sm font-bold text-[var(--gl-text-primary)] uppercase tracking-wider">Chỉnh Sửa Đánh Giá</h3>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                aria-label="Đóng cửa sổ"
                className="text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-[var(--gl-bg-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateReviewSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[var(--gl-text-secondary)] block font-semibold">Chọn Số Sao *</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`${star} sao`}
                      onClick={() => setEditRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-lg"
                    >
                      <Star className={`w-6 h-6 ${star <= editRating ? "text-amber-400 fill-current" : "text-[var(--gl-text-muted)]"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--gl-text-secondary)] block font-semibold">Bình luận *</label>
                <textarea
                  required
                  rows={4}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Cập nhật bình luận của bạn..."
                  className="w-full p-3.5 rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] transition-all text-xs"
                />
              </div>

              {editError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-[var(--gl-danger)] rounded-lg text-[11px] leading-relaxed">
                  {editError}
                </div>
              )}

              <div className="flex gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="flex-1 min-h-[44px] py-2.5 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] hover:bg-[var(--gl-bg-elevated)] text-[var(--gl-text-primary)] rounded-xl font-bold uppercase cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingReview}
                  className="flex-1 min-h-[44px] py-2.5 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 rounded-xl font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  {isUpdatingReview ? "Đang lưu..." : "Cập Nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modals for Native Dialog Replacements */}
      <ConfirmModal
        isOpen={deleteReviewOpen}
        title="Xác nhận xóa đánh giá"
        message="Bạn có chắc chắn muốn xóa đánh giá này? Thao tác này không thể hoàn tác."
        confirmLabel="Xác nhận xóa"
        cancelLabel="Không"
        onConfirm={handleDeleteReviewConfirmed}
        onCancel={() => {
          setDeleteReviewOpen(false);
          setDeleteReviewId(null);
        }}
        isDanger={true}
      />
    </div>
  );
};
