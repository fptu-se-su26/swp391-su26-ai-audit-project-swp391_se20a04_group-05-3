import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Tag, 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Check, 
  X, 
  Clock, 
  Edit, 
  FileText, 
  Ban, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Calendar, 
  DollarSign, 
  Percent, 
  Eye, 
  TrendingUp, 
  Coins 
} from "lucide-react";

import { 
  AdminPromotionService, 
  PromotionSummaryResponse, 
  PromotionDetailResponse, 
  PromotionStatus, 
  PromotionScopeType, 
  PromotionFundingSource, 
  PromotionDiscountType,
  CreatePromotionRequest,
  UpdatePromotionDraftRequest
} from "../../services/adminPromotionService";
import { AdminStoreService, StoreResponse as BackendStoreResponse } from "../../services/adminStoreService";
import toast from "react-hot-toast";
import { TableSkeleton } from "../common/Skeleton";
import { EmptyState } from "../common/EmptyState";

export const AdminPromotionsTab: React.FC = () => {
  // Real database-driven product state (ACTIVE only)
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  // Real database-driven approved store state
  const [dbStores, setDbStores] = useState<BackendStoreResponse[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  // Fetch real active products on load
  const fetchActiveProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductError(null);
    try {
      const { PlantService } = await import("../../services/plantService");
      const allProducts = await PlantService.getProducts();
      const activeProducts = allProducts.filter(p => p.status === "ACTIVE");
      setDbProducts(activeProducts);
    } catch (err: any) {
      setProductError("Không thể tải danh sách sản phẩm từ hệ thống: " + (err.message || err));
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Fetch real approved stores on load
  const fetchApprovedStores = useCallback(async () => {
    setLoadingStores(true);
    setStoreError(null);
    try {
      const stores = await AdminStoreService.getApprovedStores();
      setDbStores(stores);
    } catch (err: any) {
      setStoreError("Không thể tải danh sách cửa hàng đã duyệt: " + (err.message || err));
    } finally {
      setLoadingStores(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveProducts();
    fetchApprovedStores();
  }, [fetchActiveProducts, fetchApprovedStores]);

  // Lists & Filtering
  const [promotions, setPromotions] = useState<PromotionSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [scopeFilter, setScopeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Detail Modal
  const [selectedPromo, setSelectedPromo] = useState<PromotionDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form Modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingVersion, setEditingVersion] = useState<number>(0);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formScope, setFormScope] = useState<PromotionScopeType>("GLOBAL");
  const [formDiscountType, setFormDiscountType] = useState<PromotionDiscountType>("PERCENTAGE");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formMaxDiscount, setFormMaxDiscount] = useState("");
  const [formFundingSource, setFormFundingSource] = useState<PromotionFundingSource>("PLATFORM_FUNDED");
  const [formPlatformRatio, setFormPlatformRatio] = useState("100");
  const [formStoreRatio, setFormStoreRatio] = useState("0");
  const [formPriority, setFormPriority] = useState("10");
  const [formBudget, setFormBudget] = useState("");
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Action Reason Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionPromo, setActionPromo] = useState<{ id: number; version: number; type: "activate" | "end" | "cancel" } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch Promotions List
  const fetchPromotions = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      const statusParam = statusFilter === "ALL" ? undefined : (statusFilter as PromotionStatus);
      const scopeParam = scopeFilter === "ALL" ? undefined : (scopeFilter as PromotionScopeType);
      
      const data = await AdminPromotionService.list({
        status: statusParam,
        scopeType: scopeParam,
        page: pageNum,
        size: 10
      });
      
      setPromotions(data.content || []);
      setTotalPages(data.totalPages || 0);
      setPage(data.number || 0);
    } catch (err: any) {
      toast.error("Lỗi khi tải danh sách khuyến mãi: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, scopeFilter]);

  useEffect(() => {
    fetchPromotions(0);
  }, [fetchPromotions]);

  // Load Detail
  const handleViewDetail = async (id: number) => {
    setLoadingDetail(true);
    try {
      const detail = await AdminPromotionService.getDetail(id);
      setSelectedPromo(detail);
    } catch (err: any) {
      toast.error("Lỗi tải chi tiết khuyến mãi: " + (err.message || err));
    } finally {
      setLoadingDetail(false);
    }
  };

  // Sync Funding Ratios based on Funding Source
  useEffect(() => {
    if (formFundingSource === "PLATFORM_FUNDED") {
      setFormPlatformRatio("100");
      setFormStoreRatio("0");
    } else if (formFundingSource === "STORE_FUNDED") {
      setFormPlatformRatio("0");
      setFormStoreRatio("100");
    } else if (formFundingSource === "CO_FUNDED" && editingId === null) {
      setFormPlatformRatio("50");
      setFormStoreRatio("50");
    }
  }, [formFundingSource, editingId]);

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName("");
    setFormDesc("");
    setFormScope("GLOBAL");
    setFormDiscountType("PERCENTAGE");
    setFormDiscountValue("");
    setFormMaxDiscount("");
    setFormFundingSource("PLATFORM_FUNDED");
    setFormPlatformRatio("100");
    setFormStoreRatio("0");
    setFormPriority("10");
    setFormBudget("");
    setSelectedStoreIds([]);
    setSelectedProductIds([]);
    setFormOpen(true);
  };

  // Open Form for Edit (Draft only)
  const handleOpenEdit = async (promoSummary: PromotionSummaryResponse) => {
    if (promoSummary.status !== "DRAFT") {
      toast.error("Chỉ có thể chỉnh sửa khuyến mãi ở trạng thái DRAFT.");
      return;
    }

    setLoadingDetail(true);
    try {
      const detail = await AdminPromotionService.getDetail(promoSummary.id);
      setEditingId(detail.id);
      setEditingVersion(detail.version);
      
      setFormName(detail.name);
      setFormDesc(detail.description || "");
      setFormScope(detail.scopeType);
      setFormDiscountType(detail.discountType);
      setFormDiscountValue(String(detail.discountValue));
      setFormMaxDiscount(detail.maxDiscountAmount ? String(detail.maxDiscountAmount) : "");
      setFormFundingSource(detail.fundingSource);
      setFormPlatformRatio(String(detail.platformFundingRatio));
      setFormStoreRatio(String(detail.storeFundingRatio));
      setFormPriority(String(detail.priority));
      setFormBudget(String(detail.budget));
      setSelectedStoreIds(detail.storeIds || []);
      setSelectedProductIds(detail.productIds || []);
      
      setFormOpen(true);
    } catch (err: any) {
      toast.error("Lỗi khi tải chi tiết khuyến mãi để sửa: " + (err.message || err));
    } finally {
      setLoadingDetail(false);
    }
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form Validations
    if (!formName.trim()) {
      toast.error("Vui lòng nhập tên chương trình khuyến mãi.");
      return;
    }

    const value = parseFloat(formDiscountValue);
    if (isNaN(value) || value <= 0) {
      toast.error("Mức giảm giá phải lớn hơn 0.");
      return;
    }

    if (formDiscountType === "PERCENTAGE" && value > 100) {
      toast.error("Mức giảm phần trăm không được vượt quá 100%.");
      return;
    }

    const budgetVal = parseFloat(formBudget);
    if (isNaN(budgetVal) || budgetVal <= 0) {
      toast.error("Ngân sách khuyến mãi phải lớn hơn 0.");
      return;
    }

    const priorityVal = parseInt(formPriority);
    if (isNaN(priorityVal) || priorityVal < 0 || priorityVal > 100) {
      toast.error("Độ ưu tiên phải nằm trong khoảng 0 đến 100.");
      return;
    }

    const platRatio = parseFloat(formPlatformRatio);
    const stRatio = parseFloat(formStoreRatio);
    if (isNaN(platRatio) || isNaN(stRatio) || platRatio + stRatio !== 100) {
      toast.error("Tổng tỷ lệ chia sẻ tài trợ từ Nền tảng và Cửa hàng phải bằng 100%.");
      return;
    }

    if (formFundingSource === "PLATFORM_FUNDED" && platRatio !== 100) {
      toast.error("Nguồn tài trợ Nền tảng yêu cầu tỷ lệ Nền tảng là 100%.");
      return;
    }
    if (formFundingSource === "STORE_FUNDED" && stRatio !== 100) {
      toast.error("Nguồn tài trợ Cửa hàng yêu cầu tỷ lệ Cửa hàng là 100%.");
      return;
    }

    if (formScope === "STORE" && selectedStoreIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một cửa hàng mục tiêu.");
      return;
    }

    if (formScope === "PRODUCT" && selectedProductIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm mục tiêu.");
      return;
    }

    const maxDiscAmount = formDiscountType === "PERCENTAGE" && formMaxDiscount.trim() 
      ? parseFloat(formMaxDiscount) 
      : null;

    setSubmittingForm(true);

    try {
      if (editingId !== null) {
        const req: UpdatePromotionDraftRequest = {
          name: formName.trim(),
          description: formDesc.trim() || undefined,
          scopeType: formScope,
          discountType: formDiscountType,
          discountValue: value,
          maxDiscountAmount: maxDiscAmount,
          fundingSource: formFundingSource,
          platformFundingRatio: platRatio,
          storeFundingRatio: stRatio,
          priority: priorityVal,
          budget: budgetVal,
          storeIds: formScope === "STORE" ? selectedStoreIds : [],
          productIds: formScope === "PRODUCT" ? selectedProductIds : [],
          version: editingVersion
        };
        await AdminPromotionService.updateDraft(editingId, req);
        toast.success("Cập nhật khuyến mãi DRAFT thành công.");
      } else {
        const req: CreatePromotionRequest = {
          name: formName.trim(),
          description: formDesc.trim() || undefined,
          scopeType: formScope,
          discountType: formDiscountType,
          discountValue: value,
          maxDiscountAmount: maxDiscAmount,
          fundingSource: formFundingSource,
          platformFundingRatio: platRatio,
          storeFundingRatio: stRatio,
          priority: priorityVal,
          budget: budgetVal,
          storeIds: formScope === "STORE" ? selectedStoreIds : [],
          productIds: formScope === "PRODUCT" ? selectedProductIds : []
        };
        await AdminPromotionService.createDraft(req);
        toast.success("Khởi tạo chiến dịch khuyến mãi DRAFT thành công.");
      }
      setFormOpen(false);
      fetchPromotions(page);
    } catch (err: any) {
      toast.error("Lỗi persistent: " + (err.message || err));
    } finally {
      setSubmittingForm(false);
    }
  };

  // Toggle Target Checkboxes
  const handleToggleStore = (storeId: number) => {
    setSelectedStoreIds(prev => 
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  const handleToggleProduct = (prodId: number) => {
    setSelectedProductIds(prev => 
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  // Open Action Modal (Activate/End/Cancel)
  const handleOpenAction = (id: number, version: number, type: "activate" | "end" | "cancel") => {
    setActionPromo({ id, version, type });
    setActionReason("");
    setActionModalOpen(true);
  };

  // Submit Transition Action
  const handleConfirmAction = async () => {
    if (!actionPromo) return;
    setSubmittingAction(true);
    try {
      const { id, version, type } = actionPromo;
      const reasonText = actionReason.trim() || undefined;
      
      if (type === "activate") {
        await AdminPromotionService.activate(id, version, reasonText);
        toast.success("Đã kích hoạt chương trình khuyến mãi sang ACTIVE thành công.");
      } else if (type === "end") {
        await AdminPromotionService.end(id, version, reasonText);
        toast.success("Đã kết thúc chiến dịch khuyến mãi thành công.");
      } else if (type === "cancel") {
        await AdminPromotionService.cancel(id, version, reasonText);
        toast.success("Đã hủy bỏ khuyến mãi thành công.");
      }
      
      setActionModalOpen(false);
      setActionPromo(null);
      fetchPromotions(page);
      
      // If detail modal is open for this item, refresh it
      if (selectedPromo && selectedPromo.id === id) {
        handleViewDetail(id);
      }
    } catch (err: any) {
      toast.error("Lỗi khi thay đổi trạng thái: " + (err.message || err));
    } finally {
      setSubmittingAction(false);
    }
  };

  // Helpers for display
  const getStatusBadge = (status: PromotionStatus) => {
    switch (status) {
      case "DRAFT":
        return "bg-stone-800 text-stone-300 border-stone-700";
      case "ACTIVE":
        return "bg-emerald-950/60 text-emerald-450 border-emerald-900";
      case "ENDED":
        return "bg-rose-950/40 text-rose-455 border-rose-900/30";
      case "CANCELLED":
        return "bg-stone-900 text-stone-500 border-stone-850";
      default:
        return "bg-stone-900 text-stone-400 border-stone-800";
    }
  };

  const getScopeLabel = (scope: PromotionScopeType) => {
    switch (scope) {
      case "GLOBAL": return "Toàn sàn (Global)";
      case "STORE": return "Cửa hàng (Store)";
      case "PRODUCT": return "Sản phẩm (Product)";
    }
  };

  const getFundingLabel = (source: PromotionFundingSource) => {
    switch (source) {
      case "PLATFORM_FUNDED": return "Nền tảng tài trợ 100%";
      case "STORE_FUNDED": return "Cửa hàng tài trợ 100%";
      case "CO_FUNDED": return "Đồng tài trợ (Co-funded)";
    }
  };

  return (
    <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-5 shadow-xs animate-slide-down text-xs">
      
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase flex items-center gap-2">
            <Tag className="h-5 w-5 text-emerald-500" />
            Chiến Dịch Khuyến Mãi & Giảm Giá Thủ Công
          </h3>
          <p className="text-[10px] text-stone-450 dark:text-stone-400">
            Quản trị các chương trình trợ giá trực tiếp của sàn, phân bổ hạn mức ngân sách dự phòng và thay đổi trạng thái áp dụng theo thời gian thực.
          </p>
        </div>
        
        <button
          onClick={handleOpenCreate}
          className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-500/10 uppercase self-start lg:self-auto"
        >
          <Plus className="h-4 w-4" />
          Tạo Chiến Dịch Mới
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 bg-stone-100/50 dark:bg-stone-900/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-850">
        <div className="flex items-center gap-1.5">
          <Filter className="h-4.5 w-4.5 text-stone-400" />
          <span className="font-semibold text-stone-500 dark:text-stone-400">Bộ lọc:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-stone-200 dark:bg-stone-900 border border-stone-300 dark:border-stone-800 text-stone-800 dark:text-stone-250 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp (DRAFT)</option>
          <option value="ACTIVE">Kích hoạt (ACTIVE)</option>
          <option value="ENDED">Kết thúc (ENDED)</option>
          <option value="CANCELLED">Hủy bỏ (CANCELLED)</option>
        </select>

        {/* Scope Filter */}
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="bg-stone-200 dark:bg-stone-900 border border-stone-300 dark:border-stone-800 text-stone-800 dark:text-stone-250 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="ALL">Tất cả phạm vi</option>
          <option value="GLOBAL">Toàn hệ thống (GLOBAL)</option>
          <option value="STORE">Theo cửa hàng (STORE)</option>
          <option value="PRODUCT">Theo sản phẩm (PRODUCT)</option>
        </select>
      </div>

      {/* Promotions Table */}
      <div className="overflow-x-auto text-xs rounded-xl border border-stone-200 dark:border-stone-850">
        <table className="w-full text-left text-stone-650 dark:text-stone-300 border-collapse">
          <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase font-mono text-[9px]">
            <tr>
              <th className="p-4.5">Tên chương trình</th>
              <th className="p-4.5 text-center">Phạm vi</th>
              <th className="p-4.5 text-center">Mức giảm</th>
              <th className="p-4.5 text-center">Độ ưu tiên</th>
              <th className="p-4.5 text-right">Ngân sách</th>
              <th className="p-4.5 text-center">Trạng thái</th>
              <th className="p-4.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-4">
                  <TableSkeleton rows={5} cols={7} />
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8">
                  <EmptyState
                    icon={Tag}
                    title="Không có chiến dịch"
                    description="Không tìm thấy chiến dịch khuyến mãi nào phù hợp bộ lọc."
                  />
                </td>
              </tr>
            ) : (
              promotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-stone-100/50 dark:hover:bg-stone-900/40 transition-colors">
                  {/* Name */}
                  <td className="p-4.5 font-semibold text-stone-900 dark:text-stone-100">
                    <div>
                      <span className="block">{promo.name}</span>
                      <span className="text-[9px] text-stone-400 font-mono block">ID: {promo.id}</span>
                    </div>
                  </td>
                  
                  {/* Scope */}
                  <td className="p-4.5 text-center font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-900 text-stone-500 dark:text-stone-400">
                      {promo.scopeType}
                    </span>
                  </td>

                  {/* Value */}
                  <td className="p-4.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-450">
                    {promo.discountType === "PERCENTAGE" 
                      ? `${promo.discountValue}%` 
                      : `${promo.discountValue.toLocaleString("vi-VN")}₫`
                    }
                  </td>

                  {/* Priority */}
                  <td className="p-4.5 text-center font-mono">
                    {promo.priority}
                  </td>

                  {/* Budget */}
                  <td className="p-4.5 text-right font-mono font-semibold">
                    {promo.budget.toLocaleString("vi-VN")}₫
                  </td>

                  {/* Status */}
                  <td className="p-4.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[8px] font-bold uppercase border ${getStatusBadge(promo.status)}`}>
                      {promo.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-4.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleViewDetail(promo.id)}
                        className="p-1 px-2.5 bg-stone-200 dark:bg-stone-900 hover:bg-stone-300 dark:hover:bg-stone-800 text-stone-750 dark:text-stone-300 font-semibold rounded-lg text-[10px] cursor-pointer transition-all flex items-center gap-1 border border-stone-250 dark:border-stone-800"
                        title="Xem chi tiết & Nhật ký"
                      >
                        <Eye className="h-3 w-3" />
                      </button>

                      {promo.status === "DRAFT" && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(promo)}
                            className="p-1 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-450 font-semibold rounded-lg text-[10px] cursor-pointer transition-all flex items-center gap-1 border border-amber-550/20"
                            title="Sửa chương trình nháp"
                          >
                            <Edit className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => handleOpenAction(promo.id, promo.version, "activate")}
                            className="p-1 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 font-semibold rounded-lg text-[10px] cursor-pointer transition-all flex items-center gap-1 border border-emerald-550/20"
                            title="Kích hoạt áp dụng"
                          >
                            <Play className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => handleOpenAction(promo.id, promo.version, "cancel")}
                            className="p-1 px-2.5 bg-stone-800 hover:bg-stone-750 text-stone-400 font-semibold rounded-lg text-[10px] cursor-pointer transition-all flex items-center gap-1 border border-stone-700"
                            title="Hủy bỏ chương trình"
                          >
                            <Ban className="h-3 w-3" />
                          </button>
                        </>
                      )}

                      {promo.status === "ACTIVE" && (
                        <button
                          onClick={() => handleOpenAction(promo.id, promo.version, "end")}
                          className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-455 font-semibold rounded-lg text-[10px] cursor-pointer transition-all flex items-center gap-1 border border-rose-550/20"
                          title="Kết thúc chiến dịch sớm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-850">
          <span className="text-[10px] text-stone-400">
            Trang {page + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0 || loading}
              onClick={() => fetchPromotions(page - 1)}
              className="p-1 px-3 bg-stone-200 dark:bg-stone-900 hover:bg-stone-300 dark:hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-200 dark:disabled:hover:bg-stone-900 text-stone-750 dark:text-stone-300 font-semibold rounded-lg text-[10px] cursor-pointer transition-all border border-stone-250 dark:border-stone-800"
            >
              Trước
            </button>
            <button
              disabled={page >= totalPages - 1 || loading}
              onClick={() => fetchPromotions(page + 1)}
              className="p-1 px-3 bg-stone-200 dark:bg-stone-900 hover:bg-stone-300 dark:hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-200 dark:disabled:hover:bg-stone-900 text-stone-750 dark:text-stone-300 font-semibold rounded-lg text-[10px] cursor-pointer transition-all border border-stone-250 dark:border-stone-800"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* ==================== CREATE / EDIT MODAL DRAWER ==================== */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-stone-950 border border-stone-850 w-full max-w-2xl rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative my-8 animate-slide-down text-left text-xs">
            <button 
              onClick={() => setFormOpen(false)}
              className="absolute right-4.5 top-4.5 p-2 rounded-full bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-emerald-500 font-bold uppercase tracking-widest block">PROMOTION PLANNER</span>
              <h3 className="text-xl font-display font-bold text-stone-100 flex items-center gap-2">
                <Tag className="h-6 w-6 text-emerald-500 animate-pulse" />
                {editingId !== null ? "Hiệu Chỉnh Khuyến Mãi DRAFT" : "Thiết Lập Chiến Dịch Khuyến Mãi Mới"}
              </h3>
              <p className="text-[10px] text-stone-400">
                Lưu ý: Chỉ áp dụng lưu cấu hình ở trạng thái nháp DRAFT trước khi kích hoạt.
              </p>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campaign Name */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-stone-400 block font-semibold">Tên chương trình *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Chiến dịch mùa hè xanh trợ giá 15%"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-250 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-stone-400 block font-semibold">Mô tả chi tiết</label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả tóm tắt mục tiêu chiến dịch áp dụng..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-250 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                {/* Scope Type */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Phạm vi áp dụng *</label>
                  <select
                    value={formScope}
                    onChange={(e) => setFormScope(e.target.value as PromotionScopeType)}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-250 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
                  >
                    <option value="GLOBAL">Toàn bộ sàn giao dịch (GLOBAL)</option>
                    <option value="STORE">Theo danh sách Cửa Hàng (STORE)</option>
                    <option value="PRODUCT">Theo danh sách Sản Phẩm (PRODUCT)</option>
                  </select>
                </div>

                {/* Funding Source */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Nguồn lực tài trợ *</label>
                  <select
                    value={formFundingSource}
                    onChange={(e) => setFormFundingSource(e.target.value as PromotionFundingSource)}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-250 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
                  >
                    <option value="PLATFORM_FUNDED">Nền tảng GreenLife tài trợ 100%</option>
                    <option value="STORE_FUNDED">Nhà Vườn tự chi trả 100%</option>
                    <option value="CO_FUNDED">Hai bên đồng tài trợ (Co-funded)</option>
                  </select>
                </div>

                {/* Platform Funding Ratio */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Tỷ lệ Nền tảng chia sẻ (%) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    disabled={formFundingSource !== "CO_FUNDED"}
                    value={formPlatformRatio}
                    onChange={(e) => {
                      setFormPlatformRatio(e.target.value);
                      const parsed = parseFloat(e.target.value);
                      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                        setFormStoreRatio(String(100 - parsed));
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-250 focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-50"
                  />
                </div>

                {/* Store Funding Ratio */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Tỷ lệ Nhà Vườn chia sẻ (%) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    disabled={formFundingSource !== "CO_FUNDED"}
                    value={formStoreRatio}
                    onChange={(e) => {
                      setFormStoreRatio(e.target.value);
                      const parsed = parseFloat(e.target.value);
                      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                        setFormPlatformRatio(String(100 - parsed));
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-250 focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-50"
                  />
                </div>

                {/* Discount Type */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Phương thức giảm giá *</label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as PromotionDiscountType)}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-250 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
                  >
                    <option value="PERCENTAGE">Giảm phần trăm (%)</option>
                    <option value="FIXED">Khấu trừ tiền cố định (VND)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">
                    Mức giảm giá ({formDiscountType === "PERCENTAGE" ? "%" : "VND"}) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={formDiscountType === "PERCENTAGE" ? "Ví dụ: 15" : "Ví dụ: 20000"}
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-250 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Max Discount Amount */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Giới hạn giảm tối đa (VND) {formDiscountType === "PERCENTAGE" ? "" : "(Không khả dụng)"}</label>
                  <input
                    type="number"
                    disabled={formDiscountType !== "PERCENTAGE"}
                    placeholder="Không giới hạn"
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-250 focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-30"
                  />
                </div>

                {/* Budget */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Hạn mức ngân sách trợ giá (VND) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 5000000"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-250 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Độ ưu tiên áp dụng (0 - 100) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    placeholder="Mức độ chen giá ưu tiên"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-250 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* STORE target list */}
              {formScope === "STORE" && (
                <div className="space-y-2 border-t border-stone-850 pt-4">
                  <label className="text-stone-400 block font-semibold">Chọn Cửa Hàng Áp Dụng *</label>
                  {loadingStores && <div className="text-stone-500">Đang tải danh sách cửa hàng đã duyệt...</div>}
                  {storeError && <div className="text-rose-500 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">{storeError}</div>}
                  {!loadingStores && !storeError && dbStores.length === 0 && (
                    <div className="text-stone-500 italic">Không có cửa hàng nào đã được phê duyệt (APPROVED).</div>
                  )}
                  {!loadingStores && !storeError && dbStores.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2 bg-stone-900/50 p-3 rounded-xl border border-stone-800">
                      {dbStores.map(st => {
                        const isChecked = selectedStoreIds.includes(st.id);
                        return (
                          <label key={st.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleStore(st.id)}
                              className="h-4 w-4 rounded bg-stone-950 border-stone-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                            />
                            <div>
                              <span className="block font-semibold text-stone-200">{st.name}</span>
                              <span className="text-[10px] text-stone-500 block">{st.city}, {st.district} — ID: {st.id}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {formScope === "PRODUCT" && (
                <div className="space-y-2 border-t border-stone-850 pt-4">
                  <label className="text-stone-400 block font-semibold">Chọn Sản Phẩm áp dụng *</label>
                  {loadingProducts && <div className="text-stone-500">Đang tải danh sách sản phẩm từ hệ thống...</div>}
                  {productError && <div className="text-rose-500 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">{productError}</div>}
                  {!loadingProducts && !productError && dbProducts.length === 0 && (
                    <div className="text-stone-500 italic">Không tìm thấy sản phẩm hoạt động (ACTIVE) nào.</div>
                  )}
                  {!loadingProducts && !productError && dbProducts.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2 bg-stone-900/50 p-3 rounded-xl border border-stone-800">
                      {dbProducts.map(p => {
                        const idNum = parseInt(p.id);
                        const isChecked = selectedProductIds.includes(isNaN(idNum) ? 0 : idNum);
                        return (
                          <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProduct(isNaN(idNum) ? 0 : idNum)}
                              className="h-4 w-4 rounded bg-stone-950 border-stone-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                            />
                            <div>
                              <span className="block font-semibold text-stone-200">{p.name}</span>
                              <span className="text-[10px] text-stone-500 block">Giá niêm yết: {p.price.toLocaleString("vi-VN")}₫</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4.5 pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 font-bold rounded-xl cursor-pointer transition-colors border border-stone-800 uppercase"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-emerald-500/10 uppercase border border-emerald-400 disabled:opacity-50"
                >
                  {submittingForm ? "Đang xử lý..." : editingId !== null ? "Cập Nhật Chiến Dịch" : "Tạo Chiến Dịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DETAIL / AUDIT LOG MODAL ==================== */}
      {selectedPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-stone-950 border border-stone-850 w-full max-w-2xl rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative my-8 animate-slide-down text-left text-xs text-stone-300">
            <button 
              onClick={() => setSelectedPromo(null)}
              className="absolute right-4.5 top-4.5 p-2 rounded-full bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1.5 pb-4 border-b border-stone-850">
              <span className="text-[9px] font-mono text-emerald-500 font-bold uppercase tracking-widest block">CAMPAIGN DETAIL & AUDIT LOGS</span>
              <h3 className="text-xl font-display font-bold text-stone-100 flex items-center gap-2">
                <FileText className="h-6 w-6 text-emerald-500" />
                {selectedPromo.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${getStatusBadge(selectedPromo.status)}`}>
                  {selectedPromo.status}
                </span>
                <span className="text-[10px] text-stone-500 font-mono">Phiên bản khóa: v{selectedPromo.version}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
              {/* Left Column: Properties */}
              <div className="space-y-4">
                <div>
                  <span className="text-stone-500 font-semibold block">Mô tả</span>
                  <p className="text-stone-200 mt-1">{selectedPromo.description || "Không có mô tả chi tiết."}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-stone-900/50 p-4 rounded-2xl border border-stone-800 font-mono">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block">Phạm vi</span>
                    <span className="font-bold text-stone-200 block mt-0.5">{getScopeLabel(selectedPromo.scopeType)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block">Giảm giá</span>
                    <span className="font-bold text-emerald-450 block mt-0.5">
                      {selectedPromo.discountType === "PERCENTAGE" 
                        ? `${selectedPromo.discountValue}%` 
                        : `${selectedPromo.discountValue.toLocaleString("vi-VN")}₫`
                      }
                    </span>
                  </div>
                  {selectedPromo.maxDiscountAmount && (
                    <div className="col-span-2 border-t border-stone-800/50 pt-2">
                      <span className="text-[10px] text-stone-500 uppercase block">Mức tối đa giảm</span>
                      <span className="font-bold text-stone-200 block mt-0.5">{selectedPromo.maxDiscountAmount.toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-stone-500 font-semibold block">Tài trợ & Đồng tài trợ</span>
                  <div className="p-3 bg-stone-900/40 rounded-xl border border-stone-850 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Nguồn chính:</span>
                      <span className="text-stone-200 font-bold">{getFundingLabel(selectedPromo.fundingSource)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Nền tảng trợ giá:</span>
                      <span className="text-stone-200">{selectedPromo.platformFundingRatio}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Nhà Vườn trợ giá:</span>
                      <span className="text-stone-200">{selectedPromo.storeFundingRatio}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Budgets & Dates */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-stone-500 font-semibold block">Dòng chảy ngân sách chiến dịch</span>
                  <div className="bg-stone-900/60 p-4 rounded-2xl border border-stone-800 font-mono space-y-2.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Ngân sách tổng cấp:</span>
                      <span className="text-stone-200 font-bold">{selectedPromo.budget.toLocaleString("vi-VN")}₫</span>
                    </div>
                    <div className="flex justify-between border-t border-stone-800/40 pt-2">
                      <span className="text-stone-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Tạm giữ (Reserved):
                      </span>
                      <span className="text-amber-500 font-semibold">{selectedPromo.reservedBudget.toLocaleString("vi-VN")}₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Tiêu dùng (Consumed):
                      </span>
                      <span className="text-rose-455 font-semibold">{selectedPromo.consumedBudget.toLocaleString("vi-VN")}₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Giải phóng (Released):
                      </span>
                      <span className="text-emerald-450 font-semibold">{selectedPromo.releasedBudget.toLocaleString("vi-VN")}₫</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 font-mono text-[10px] text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-stone-500" />
                    <span>Khởi tạo lúc: {new Date(selectedPromo.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  {selectedPromo.activatedAt && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Kích hoạt lúc: {new Date(selectedPromo.activatedAt).toLocaleString("vi-VN")}</span>
                    </div>
                  )}
                  {selectedPromo.endedAt && (
                    <div className="flex items-center gap-1.5">
                      <X className="h-3.5 w-3.5 text-rose-500" />
                      <span>Kết thúc lúc: {new Date(selectedPromo.endedAt).toLocaleString("vi-VN")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Target IDs lists mapping back to names */}
            {(selectedPromo.scopeType === "STORE" || selectedPromo.scopeType === "PRODUCT") && (
              <div className="border-t border-stone-850 pt-4 space-y-2">
                <span className="text-stone-500 font-semibold block">Đối tượng chỉ định áp dụng</span>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto bg-stone-900/30 p-3 rounded-xl border border-stone-850 font-mono text-[10px]">
                  {selectedPromo.scopeType === "STORE" && (
                    selectedPromo.storeIds.map(sid => {
                      const name = dbStores.find(s => s.id === sid)?.name || `Cửa hàng #${sid}`;
                      return (
                        <span key={sid} className="px-2 py-0.5 bg-stone-900 border border-stone-800 text-stone-300 rounded">
                          {name}
                        </span>
                      );
                    })
                  )}
                  {selectedPromo.scopeType === "PRODUCT" && (
                    selectedPromo.productIds.map(pid => {
                      const name = dbProducts.find(p => parseInt(p.id) === pid)?.name || `Sản phẩm #${pid}`;
                      return (
                        <span key={pid} className="px-2 py-0.5 bg-stone-900 border border-stone-800 text-stone-300 rounded">
                          {name}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Audit History Log Block */}
            <div className="border-t border-stone-850 pt-4 space-y-2.5">
              <span className="text-stone-500 font-semibold block flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-stone-400" />
                Nhật Ký Kiểm Toán Trạng Thái (Audit Logs)
              </span>
              <div className="overflow-x-auto rounded-xl border border-stone-850">
                <table className="w-full text-left text-stone-400 border-collapse">
                  <thead className="bg-stone-900 border-b border-stone-800 text-[8px] font-mono text-stone-500 uppercase">
                    <tr>
                      <th className="p-3">Thời gian</th>
                      <th className="p-3">Người thực hiện</th>
                      <th className="p-3 text-center">Hành động</th>
                      <th className="p-3 text-center">Chuyển đổi</th>
                      <th className="p-3">Lý do</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-850 font-mono text-[10px]">
                    {selectedPromo.auditHistory && selectedPromo.auditHistory.length > 0 ? (
                      selectedPromo.auditHistory.map((log) => (
                        <tr key={log.id} className="hover:bg-stone-900/30">
                          <td className="p-3 whitespace-nowrap text-[9px] text-stone-500">
                            {new Date(log.createdAt).toLocaleString("vi-VN")}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-stone-300 block">User ID: #{log.actorUserId}</span>
                          </td>
                          <td className="p-3 text-center font-bold text-stone-300 uppercase">
                            {log.actionType}
                          </td>
                          <td className="p-3 text-center text-[9px]">
                            <span className="text-stone-500">{log.previousStatus}</span>
                            <span className="text-stone-600 mx-1">→</span>
                            <span className="text-emerald-500 font-bold">{log.newStatus}</span>
                          </td>
                          <td className="p-3 text-stone-300 italic truncate max-w-xs" title={log.reason || ""}>
                            {log.reason || <span className="text-stone-600">-</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-stone-600">
                          Không có bản ghi nhật ký nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick action button within details */}
            <div className="flex gap-3 pt-4 border-t border-stone-850">
              {selectedPromo.status === "DRAFT" && (
                <>
                  <button
                    onClick={() => {
                      const id = selectedPromo.id;
                      const version = selectedPromo.version;
                      setSelectedPromo(null);
                      handleOpenEdit(selectedPromo);
                    }}
                    className="flex-1 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-550 border border-amber-900/30 font-bold rounded-xl uppercase font-mono tracking-wider transition-all cursor-pointer text-center"
                  >
                    Hiệu Chỉnh Chiến Dịch
                  </button>
                  <button
                    onClick={() => handleOpenAction(selectedPromo.id, selectedPromo.version, "activate")}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl uppercase font-mono tracking-wider transition-all cursor-pointer text-center"
                  >
                    Kích Hoạt Chiến Dịch
                  </button>
                </>
              )}

              {selectedPromo.status === "ACTIVE" && (
                <button
                  onClick={() => handleOpenAction(selectedPromo.id, selectedPromo.version, "end")}
                  className="flex-1 py-2.5 bg-rose-955/20 text-rose-500 hover:bg-rose-955/40 border border-rose-900/30 font-bold rounded-xl uppercase font-mono tracking-wider transition-all cursor-pointer text-center"
                >
                  Kết Thúc Ngay Lập Tức
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== ACTION CONFRIM REASON MODAL ==================== */}
      {actionModalOpen && actionPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-stone-950 border border-stone-850 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative text-left text-xs">
            <button
              onClick={() => {
                setActionModalOpen(false);
                setActionPromo(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${
                actionPromo.type === "activate" 
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : actionPromo.type === "end" 
                    ? "bg-rose-500/10 text-rose-500" 
                    : "bg-stone-800 text-stone-400"
              }`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-100 font-display">
                {actionPromo.type === "activate" && "Xác nhận kích hoạt khuyến mãi"}
                {actionPromo.type === "end" && "Xác nhận kết thúc khuyến mãi"}
                {actionPromo.type === "cancel" && "Xác nhận hủy bỏ khuyến mãi"}
              </h3>
            </div>

            <div className="text-stone-300 space-y-3 leading-relaxed">
              <p>
                {actionPromo.type === "activate" && "Khuyến mãi sẽ được chuyển từ trạng thái nháp DRAFT sang ACTIVE. Khách hàng sẽ nhìn thấy các mức giá ưu đãi được tính toán tự động."}
                {actionPromo.type === "end" && "Khuyến mãi ACTIVE sẽ kết thúc ngay lập tức. Dữ liệu giá sẽ quay về giá niêm yết ban đầu."}
                {actionPromo.type === "cancel" && "Chương trình sẽ bị hủy bỏ vĩnh viễn và không thể áp dụng."}
              </p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-stone-500 uppercase block tracking-wider">
                  Lý do thực hiện {actionPromo.type === "activate" ? "(Không bắt buộc)" : "*"}
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Nhập lý do thực hiện chuyển đổi trạng thái khuyến mãi..."
                  className="w-full p-3 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActionModalOpen(false);
                  setActionPromo(null);
                }}
                className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-450 rounded-xl font-semibold cursor-pointer transition-all border border-stone-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={submittingAction || (actionPromo.type !== "activate" && !actionReason.trim())}
                className={`flex-1 py-2.5 text-black font-bold uppercase tracking-wider cursor-pointer transition-all shadow-sm rounded-xl ${
                  actionPromo.type === "activate" 
                    ? "bg-emerald-500 hover:bg-emerald-400" 
                    : actionPromo.type === "end" 
                      ? "bg-rose-500 hover:bg-rose-455 text-white" 
                      : "bg-stone-200 hover:bg-white text-stone-950"
                } disabled:opacity-50`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
