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
    <div className="space-y-8 pb-20">
      {/* Back to Catalog trigger */}
      <button
        onClick={onBackToShop}
        className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-850 dark:text-stone-400 dark:hover:text-stone-100 transition-colors cursor-pointer font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại tất cả sản phẩm
      </button>

      {/* Main Structural Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Columns - Image Presentation */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square bg-stone-100 dark:bg-stone-950 border border-stone-250 dark:border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
            {imageError || !product.image ? (
              <div className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 p-6 text-center space-y-2">
                <Leaf className="w-12 h-12 stroke-[1.5] text-stone-300 dark:text-stone-700 animate-pulse" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider">Hình ảnh sinh học</span>
                <span className="text-[10px] text-stone-450 dark:text-stone-600 max-w-[200px] leading-relaxed">Đang cập nhật hình ảnh chụp thực tế tại vườn ươm Lâm Đồng</span>
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
            <div className="absolute top-4 left-4 bg-emerald-500/10 dark:bg-emerald-950/95 border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <Leaf className="h-4 w-4" />
              Chỉ số Thân Thiện: {product.ecoScore}%
            </div>
          </div>

          {/* Premium Ecology Commitment Card */}
          <div className="bg-stone-100/50 dark:bg-stone-900/20 border border-stone-250 dark:border-stone-800 p-5 rounded-2xl space-y-3">
            <h4 className="text-xs text-stone-500 dark:text-stone-400 font-mono uppercase tracking-widest flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              BẢO CHỨNG SINH THÁI CO₂
            </h4>
            <p className="text-stone-600 dark:text-stone-300 text-xs leading-relaxed">
              Mỗi đơn hàng sản phẩm {product.name} đã được trung hòa hoàn toàn dấu chân Carbon từ vùng nguyên liệu gieo ươm Lâm Đồng về tới nội đô nhờ quy cách đóng gói sinh học.
            </p>
          </div>
        </div>

        {/* Right Columns - Details, Pricing & Customization controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono tracking-widest uppercase font-bold">{product.category}</span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-850 dark:text-stone-100 tracking-tight">{product.name}</h1>
            
            {/* Rating Stars and stock count */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-900 px-3 py-1 rounded-xl text-stone-700 dark:text-stone-200 text-sm border border-stone-200 dark:border-stone-800/80">
                <span>⭐</span>
                <span className="font-mono font-semibold">{product.rating}</span>
              </div>
              <span className="text-xs font-mono text-stone-300 dark:text-stone-800">|</span>
              <span className={`text-xs font-mono px-3 py-1.5 rounded-xl font-bold uppercase ${stockBadgeInfo.classes}`}>
                {stockBadgeInfo.text} {product.stock > 0 ? `(${product.stock})` : ""}
              </span>
              {product.isBestSeller && (
                <span className="text-xs font-mono bg-amber-500/15 text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold uppercase flex items-center gap-1.5 animate-pulse">
                  🔥 Bán chạy
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-b border-stone-200 dark:border-stone-800/60 py-4">
            <span className="text-[10px] font-mono text-stone-500 dark:text-stone-450 block font-bold uppercase tracking-wider">Giá sản phẩm:</span>
            {product.onSale && product.effectivePrice !== undefined ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-500 line-through font-mono">
                    {product.price.toLocaleString("vi-VN")}₫
                  </span>
                  {product.promotionName && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono">
                      Khuyến mãi: {product.promotionName}
                    </span>
                  )}
                </div>
                <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 block">
                  {product.effectivePrice.toLocaleString("vi-VN")}₫
                </span>
              </div>
            ) : (
              <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 block mt-1">
                {product.price.toLocaleString("vi-VN")}₫
              </span>
            )}
          </div>

          <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed">
            {product.description}
          </p>

          {/* Interactive Custom Setup: Pottery Pot & Extra Organic Addon */}
          <div className="space-y-4 pt-2">
            {/* Custom Pot Selector */}
            {product.category === "plants" && (
              <div className="space-y-2">
                <label className="text-xs text-stone-500 dark:text-stone-400 font-mono block">Lựa chọn chậu đất gốm tinh xảo:</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "classic-clay", label: "Đất nung bản địa (Hữu cơ)", desc: "Màu gạch đỏ tự dưỡng hơi ẩm" },
                    { id: "bat-trang-glaze", label: "Men độc bản Bát Tràng (+30k)", desc: "Gốm nung mộc cao tịnh chảy men" }
                  ].map((pot) => {
                    const isSelected = potOption === pot.id;
                    return (
                      <div
                        key={pot.id}
                        onClick={() => setPotOption(pot.id)}
                        className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all select-none ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400"
                            : "border-stone-250 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-950 hover:border-stone-400 dark:hover:border-stone-700 text-stone-600 dark:text-stone-400"
                        }`}
                      >
                        <h5 className={`text-xs font-semibold ${isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-stone-800 dark:text-stone-300"}`}>{pot.label}</h5>
                        <span className="text-[10px] text-stone-500 dark:text-stone-500 mt-1 block leading-normal">{pot.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Specialized Substrate Matching Toggle */}
            <div className="space-y-2">
              <label className="text-xs text-stone-500 dark:text-stone-400 font-mono block">Tiện ích tối ưu sinh thái:</label>
              <div
                onClick={() => setSoilAddon(!soilAddon)}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                  soilAddon 
                    ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20" 
                    : "border-stone-250 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-950 hover:border-stone-400 dark:hover:border-stone-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={soilAddon}
                    readOnly
                    className="w-4 h-4 rounded border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className={`text-xs font-semibold ${soilAddon ? "text-emerald-700 dark:text-emerald-400" : "text-stone-800 dark:text-stone-300"}`}>Bổ sung Phân Trùn Quế bón gốc (+35.000đ)</span>
                    <p className="text-[10px] text-stone-500 dark:text-stone-500 mt-0.5">Giúp rễ phát triển thần tốc chống thối nhũn ban đầu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quantity selector & Add to cart trigger */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-stone-250 dark:border-stone-800/40">
            <div className="flex items-center bg-stone-100 dark:bg-stone-950 border border-stone-250 dark:border-stone-850 rounded-xl">
              <button
                disabled={product.stock <= 0}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3.5 py-2 hover:bg-stone-200 dark:hover:bg-stone-850 text-stone-500 dark:text-stone-400 hover:text-stone-850 dark:hover:text-stone-100 transition-colors font-semibold text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="px-4 py-2 font-mono text-stone-850 dark:text-stone-100 text-sm font-bold">{quantity}</span>
              <button
                disabled={product.stock <= 0}
                onClick={() => setQuantity(quantity + 1)}
                className="px-3.5 py-2 hover:bg-stone-200 dark:hover:bg-stone-850 text-stone-500 dark:text-stone-400 hover:text-stone-850 dark:hover:text-stone-100 transition-colors font-semibold text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            <button
              disabled={product.stock <= 0}
              onClick={(e) => {
                // Adjust price if extra features are active
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
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-8 py-3 font-semibold rounded-xl tracking-tight transition-all cursor-pointer ${
                product.stock <= 0
                  ? "bg-stone-250 dark:bg-stone-850 text-stone-400 dark:text-stone-600 cursor-not-allowed opacity-60"
                  : "bg-emerald-500 hover:bg-emerald-400 text-stone-950 hover:shadow-sm active:scale-95"
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              {product.stock <= 0 ? "Hết Hàng Lâm Thời" : "Thêm Vào Giỏ Hàng"}
            </button>

            <button
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
              className={`p-3 rounded-xl border transition-all ${
                isLiked
                  ? "bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-500"
                  : "bg-stone-100 dark:bg-stone-950 border-stone-250 dark:border-stone-800 text-stone-500 hover:text-rose-500 cursor-pointer"
              }`}
            >
              <Heart className="h-5 w-5 fill-current" />
            </button>
          </div>

          {/* Product Specifications & Logistics FAQ Tab */}
          <div className="pt-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-100 border-b border-stone-250 dark:border-stone-800 pb-2">Thông Số Kỹ Thuật Sinh Thái</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              {specEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between p-3 bg-stone-100/50 dark:bg-stone-900/30 rounded-xl border border-stone-200 dark:border-stone-850">
                  <span className="text-stone-500 dark:text-stone-400 font-semibold">{key}:</span>
                  <span className="text-stone-800 dark:text-stone-100 font-bold text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Reviews (Shopee Flow) */}
          <div className="pt-8 space-y-6">
            <div className="flex justify-between items-center border-b border-stone-250 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold tracking-tight text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                Đánh Giá Từ Khách Hàng ({ratingSummary.totalReviews})
              </h3>
              {currentUser && (
                <button
                  onClick={handleOpenWriteModal}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                >
                  Viết Đánh Giá
                </button>
              )}
            </div>

            {/* Shopee-style Rating Dashboard */}
            <div className="bg-stone-100/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-sm">
              <div className="md:col-span-4 text-center md:border-r border-stone-200 dark:border-stone-850 pr-0 md:pr-6 space-y-1">
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {averageRating} <span className="text-sm font-normal text-stone-500">/ 5</span>
                </div>
                <div className="flex justify-center gap-1 pt-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= Math.round(Number(averageRating));
                    return <Star key={star} className={`w-4 h-4 ${active ? "text-amber-400 fill-current" : "text-stone-300 dark:text-stone-800"}`} />;
                  })}
                </div>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono font-bold">Điểm Đánh Giá Trung Bình</p>
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
                    key={fTab.id}
                    onClick={() => {
                      setSelectedFilter(fTab.id);
                      setReviewPage(0);
                    }}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      selectedFilter === fTab.id
                        ? "bg-emerald-500 border-emerald-500 text-stone-950 shadow-sm font-bold"
                        : "bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-850 dark:hover:text-stone-100 hover:border-stone-400 dark:hover:border-stone-700"
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
                  disabled={reviewPage === 0}
                  onClick={() => handlePageChange(reviewPage - 1)}
                  className="px-3 py-1.5 rounded-lg border border-stone-250 dark:border-stone-850 text-stone-500 dark:text-stone-400 hover:text-stone-850 dark:hover:text-stone-100 disabled:opacity-50 text-xs font-mono transition-all cursor-pointer"
                >
                  Trước
                </button>
                <span className="text-xs text-stone-500 dark:text-stone-450 font-mono">
                  Trang {reviewPage + 1} / {totalPages}
                </span>
                <button
                  disabled={reviewPage === totalPages - 1}
                  onClick={() => handlePageChange(reviewPage + 1)}
                  className="px-3 py-1.5 rounded-lg border border-stone-250 dark:border-stone-850 text-stone-500 dark:text-stone-400 hover:text-stone-850 dark:hover:text-stone-100 disabled:opacity-50 text-xs font-mono transition-all cursor-pointer"
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
          <div className="bg-stone-950 border border-stone-250 dark:border-stone-850 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider">Viết Đánh Giá Sản Phẩm</h3>
              <button onClick={() => setIsWriteModalOpen(false)} className="text-stone-450 hover:text-stone-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateReviewSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-stone-400 dark:text-stone-450 block font-semibold">Chọn Số Sao *</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`w-6 h-6 ${star <= newRating ? "text-amber-400 fill-current" : "text-stone-550 dark:text-stone-700"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-stone-450 block font-semibold">Bình luận *</label>
                <textarea
                  required
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                  className="w-full p-3.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-850 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-450 focus:ring-2 focus:ring-emerald-500/20 transition-all text-xs"
                />
              </div>

              {writeError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-[11px] leading-relaxed">
                  {writeError}
                </div>
              )}

              <div className="flex gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl font-bold uppercase cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm"
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
          <div className="bg-stone-950 border border-stone-250 dark:border-stone-850 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider">Chỉnh Sửa Đánh Giá</h3>
              <button onClick={() => setEditingReview(null)} className="text-stone-450 hover:text-stone-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateReviewSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-stone-400 dark:text-stone-450 block font-semibold">Chọn Số Sao *</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`w-6 h-6 ${star <= editRating ? "text-amber-400 fill-current" : "text-stone-550 dark:text-stone-700"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-stone-450 block font-semibold">Bình luận *</label>
                <textarea
                  required
                  rows={4}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Cập nhật bình luận của bạn..."
                  className="w-full p-3.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-850 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-450 focus:ring-2 focus:ring-emerald-500/20 transition-all text-xs"
                />
              </div>

              {editError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-[11px] leading-relaxed">
                  {editError}
                </div>
              )}

              <div className="flex gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl font-bold uppercase cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingReview}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm"
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
