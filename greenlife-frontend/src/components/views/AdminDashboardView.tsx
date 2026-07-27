import React, { useState, useMemo, useCallback } from "react";
import { 
  ShieldCheck, 
  Sprout, 
  Store, 
  Users, 
  ShoppingBag, 
  Calendar, 
  Check, 
  X, 
  AlertCircle, 
  Save,
  Cpu, 
  Trash2,
  Search,
  Filter,
  ArrowUpRight,
  Activity,
  FileText,
  CheckCircle2,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Clock,
  MapPin,
  TrendingUp,
  Eye,
  Coins,
  Leaf,
  ChevronLeft,
  BookOpen,
  UploadCloud,
  Tag
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { ArticleService } from "../../services/articleService";
import PlantService from "../../services/plantService";
import { BlogPost, Product } from "../../types";
import toast from "react-hot-toast";
import { DashboardSkeleton, TableSkeleton } from "../common/Skeleton";
import { EmptyState } from "../common/EmptyState";
import { useEffect } from "react";
import { AdminUserService } from "../../services/adminUserService";
import { AdminStoreService } from "../../services/adminStoreService";
import { AdminOrderService } from "../../services/adminOrderService";
import { ReviewService, ReviewResponse } from "../../services/reviewService";
import { MessageSquare, ShieldAlert } from "lucide-react";
import { AdminSecurityService, AdminLoginAuditResponse } from "../../services/adminSecurityService";
import { getMediaUrl } from "../../utils/mediaUrl";
import { AdminPromotionsTab } from "../promotion/AdminPromotionsTab";
const SecureKycImage: React.FC<{ url: string; alt: string }> = ({ url, alt }) => {
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    let createdUrl = "";

    if (!url) {
      setLoading(false);
      setError(true);
      return;
    }

    AdminStoreService.fetchKycDocumentBlob(url)
      .then((objectUrl) => {
        if (active && objectUrl) {
          createdUrl = objectUrl;
          setBlobUrl(objectUrl);
          setLoading(false);
        } else {
          if (active) {
            setLoading(false);
            setError(true);
          }
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          setError(true);
        }
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [url]);

  if (loading) {
    return (
      <div className="border border-[var(--gl-border)] rounded-lg w-20 h-14 bg-[var(--gl-bg-surface)] flex items-center justify-center text-[9px] text-[var(--gl-text-muted)] animate-pulse font-mono">
        Đang tải...
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="border border-rose-500/20 rounded-lg w-20 h-14 bg-rose-500/5 flex items-center justify-center text-[8px] text-rose-500 text-center p-1 font-mono">
        Bảo mật KYC
      </div>
    );
  }

  return (
    <div className="border border-[var(--gl-border)] rounded-lg overflow-hidden w-20 h-14 bg-[var(--gl-bg-surface)] flex items-center justify-center cursor-pointer hover:opacity-90">
      <img src={blobUrl} alt={alt} className="max-h-full max-w-full object-contain" />
    </div>
  );
};

export const AdminDashboardView: React.FC = () => {
  const { 
    stores, 
    products, 
    updateStoreInfo,
    addNewProduct,
    setCurrentPage,
    adminActiveTab,
    setAdminActiveTab,
    blogPosts,
    refreshArticles,
    currentUser,
    loadProducts
  } = useAppContext();

  // Reference context state directly
  const activeTab = adminActiveTab;
  const setActiveTab = setAdminActiveTab;

  // Real-time database orders state loaded via API

  // Search & Filter States
  const [storeTab, setStoreTab] = useState<"pending" | "active">("pending");
  const [storeSearch, setStoreSearch] = useState("");
  const [storeCityFilter, setStoreCityFilter] = useState("");

  // Modals & Rejection States
  const [rejectStoreOpen, setRejectStoreOpen] = useState(false);
  const [rejectStoreId, setRejectStoreId] = useState<string | null>(null);
  const [rejectStoreReason, setRejectStoreReason] = useState("");
  const [rejectStoreError, setRejectStoreError] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");

  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productStockFilter, setProductStockFilter] = useState(""); // "all" | "out" | "low" | "good"

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");



  // Modals & Details states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);

  // Integration States for Phase 3A.1
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbPendingStores, setDbPendingStores] = useState<any[]>([]);
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [fallbackWarning, setFallbackWarning] = useState<string | null>(null);

  // State for storing loaded details of active/selected order
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any[] | null>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  // Integration States for Review Moderation (Phase 3A.2.1)
  const [dbReviews, setDbReviews] = useState<ReviewResponse[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(0);
  const [moderatingId, setModeratingId] = useState<number | null>(null);

  // Integration States for Security Login Logs (Phase 3A.2.2)
  const [audits, setAudits] = useState<AdminLoginAuditResponse[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [auditsError, setAuditsError] = useState("");
  const [auditsPage, setAuditsPage] = useState(0);
  const [auditsTotalPages, setAuditsTotalPages] = useState(0);
  const [auditFilterMode, setAuditFilterMode] = useState<"all" | "failed">("all");
  const [auditUserIdFilter, setAuditUserIdFilter] = useState("");
  const [appliedUserIdFilter, setAppliedUserIdFilter] = useState<number | null>(null);

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    setLoadingUsers(true);
    try {
      const usersData = await AdminUserService.getUsers({ page: 0, size: 50 }, signal);
      const mapped = usersData.content.map(u => {
        let statusStr = "Active";
        if (u.status === "LOCKED") statusStr = "Locked";
        else if (u.status === "DISABLED") statusStr = "Disabled";
        else if (u.status === "PENDING_VERIFICATION") statusStr = "Pending";

        let roleStr = "customer";
        if (u.role === "ADMIN") roleStr = "admin";
        else if (u.role === "STORE_OWNER") roleStr = "store";

        return {
          id: u.id.toString(),
          name: u.fullName || "N/A",
          email: u.email,
          role: roleStr,
          date: u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "N/A",
          phone: u.phone || "N/A",
          carbonSaved: 0,
          credits: 0,
          status: statusStr
        };
      });
      setDbUsers(mapped);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error fetching users:", err);
        setDbUsers([]);
        throw err;
      }
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchPendingStores = useCallback(async (signal?: AbortSignal) => {
    try {
      const pendingData = await AdminStoreService.getPendingStores(signal);
      const mapped = pendingData.map(s => ({
        id: s.id.toString(),
        name: s.name,
        ownerName: s.ownerName,
        ownerEmail: s.phone || "N/A",
        rating: 5.0,
        avatar: s.logoUrl || "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=100",
        bannerImage: "",
        address: s.address,
        workingHours: "08:00 - 18:00",
        carbonOffsetKg: 0,
        productsCount: 0,
        verified: false,
        city: s.city || "",
        district: s.district || "",
        verificationDocument: s.verificationDocument
      }));
      setDbPendingStores(mapped);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error fetching pending stores:", err);
        setDbPendingStores([]);
        throw err;
      }
    }
  }, []);

  const fetchOrders = useCallback(async (signal?: AbortSignal) => {
    setLoadingReports(true);
    try {
      const ordersData = await AdminOrderService.getAllOrders(signal);
      const mapped = ordersData.map(o => ({
        id: o.id.toString(),
        customerName: o.recipientName || "N/A",
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : "N/A",
        total: o.totalAmount,
        status: o.status ? o.status.toLowerCase() : "pending",
        itemsCount: o.details ? o.details.reduce((sum, d) => sum + d.quantity, 0) : 0,
        phone: o.recipientPhone || "N/A",
        address: o.shippingAddress || "N/A",
        paymentMethod: o.paymentMethod || "N/A",
        paymentStatus: o.paymentStatus || "N/A",
        note: o.note || ""
      }));
      setDbOrders(mapped);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error fetching orders:", err);
        setDbOrders([]);
        throw err;
      }
    } finally {
      setLoadingReports(false);
    }
  }, []);

  const loadAllData = useCallback(async (signal?: AbortSignal) => {
    setLoadingUsers(true);
    setLoadingReports(true);
    setFallbackWarning(null);
    let hasError = false;
    try {
      await Promise.all([
        fetchUsers(signal).catch((err) => { if (err.name !== "AbortError") throw err; }),
        fetchPendingStores(signal).catch((err) => { if (err.name !== "AbortError") throw err; }),
        fetchOrders(signal).catch((err) => { if (err.name !== "AbortError") throw err; })
      ]);
    } catch (err) {
      hasError = true;
    }
    if (hasError) {
      setFallbackWarning("Không thể đồng bộ toàn bộ dữ liệu từ máy chủ. Vui lòng thử lại sau.");
    }
    setLoadingUsers(false);
    setLoadingReports(false);
  }, [fetchUsers, fetchPendingStores, fetchOrders]);

  useEffect(() => {
    const controller = new AbortController();
    if (activeTab === "overview") {
      loadAllData(controller.signal);
    } else if (activeTab === "users") {
      fetchUsers(controller.signal).catch(() => {});
    } else if (activeTab === "stores") {
      fetchPendingStores(controller.signal).catch(() => {});
    } else if (activeTab === "orders") {
      fetchOrders(controller.signal).catch(() => {});
    }
    return () => {
      controller.abort();
    };
  }, [loadAllData, fetchUsers, fetchPendingStores, fetchOrders, activeTab]);

  // Load order details on selection
  useEffect(() => {
    if (!selectedOrder) {
      setSelectedOrderDetails(null);
      return;
    }

    const orderId = parseInt(selectedOrder.id);
    if (isNaN(orderId)) {
      setSelectedOrderDetails([]);
      return;
    }

    let active = true;
    const fetchDetails = async () => {
      setLoadingOrderDetails(true);
      try {
        const orderData = await AdminOrderService.getOrderDetail(orderId);
        if (active) {
          const mappedDetails = orderData.details ? orderData.details.map(d => ({
            name: d.productName || "Sản phẩm",
            qty: d.quantity,
            price: d.unitPrice,
            img: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=100&auto=format&fit=crop&q=80"
          })) : [];
          setSelectedOrderDetails(mappedDetails);
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        if (active) {
          setSelectedOrderDetails([]);
        }
      } finally {
        if (active) setLoadingOrderDetails(false);
      }
    };

    fetchDetails();
    return () => {
      active = false;
    };
  }, [selectedOrder]);

  const fetchReviews = useCallback(async (page: number, signal?: AbortSignal) => {
    setLoadingReviews(true);
    setReviewsError("");
    try {
      const data = await ReviewService.getAllReviewsForAdmin(page, 10, signal);
      setDbReviews(data.content || []);
      setReviewsTotalPages(data.totalPages || 0);
      setReviewsPage(data.number || 0);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error fetching reviews:", err);
        setReviewsError("Không thể tải danh sách đánh giá từ hệ thống.");
      }
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "reviews") return;
    const controller = new AbortController();
    fetchReviews(0, controller.signal);
    return () => {
      controller.abort();
    };
  }, [activeTab, fetchReviews]);

  const handleModerateReview = async (id: number, currentStatus: "VISIBLE" | "HIDDEN") => {
    setModeratingId(id);
    const targetStatus = currentStatus === "VISIBLE" ? "HIDDEN" : "VISIBLE";
    try {
      await ReviewService.moderateReview(id, targetStatus);
      toast.success("Cập nhật trạng thái kiểm duyệt thành công!");
      await fetchReviews(reviewsPage);
    } catch (err) {
      console.error("Error moderating review:", err);
      toast.error("Không thể thay đổi trạng thái kiểm duyệt.");
    } finally {
      setModeratingId(null);
    }
  };

  // Integration Handlers/Effects for Security Login Logs (Phase 3A.2.2)
  const fetchLoginAudits = useCallback(async (page: number, signal?: AbortSignal) => {
    setAuditsLoading(true);
    setAuditsError("");
    try {
      let data;
      if (appliedUserIdFilter !== null) {
        data = await AdminSecurityService.getUserLoginAudits(appliedUserIdFilter, page, 20, signal);
      } else if (auditFilterMode === "failed") {
        data = await AdminSecurityService.getFailedLoginAudits(page, 20, signal);
      } else {
        data = await AdminSecurityService.getAllLoginAudits(page, 20, signal);
      }
      setAudits(data.content || []);
      setAuditsTotalPages(data.totalPages || 0);
      setAuditsPage(data.number || 0);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error fetching login audits:", err);
        setAuditsError("Không thể tải nhật ký bảo mật hệ thống.");
      }
    } finally {
      setAuditsLoading(false);
    }
  }, [auditFilterMode, appliedUserIdFilter]);

  useEffect(() => {
    if (activeTab !== "security-logs") return;
    const controller = new AbortController();
    fetchLoginAudits(0, controller.signal);
    return () => {
      controller.abort();
    };
  }, [activeTab, fetchLoginAudits]);

  const handleSearchUserId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditUserIdFilter.trim()) {
      setAppliedUserIdFilter(null);
      return;
    }
    const parsedId = parseInt(auditUserIdFilter, 10);
    if (isNaN(parsedId)) {
      toast.error("Vui lòng nhập mã User ID là chữ số hợp lệ.");
      return;
    }
    setAppliedUserIdFilter(parsedId);
  };

  const handleResetUserId = () => {
    setAuditUserIdFilter("");
    setAppliedUserIdFilter(null);
  };

  const getFailureReasonLabel = (reason: string | null) => {
    if (!reason) return "Không xác định";
    const mapping: Record<string, string> = {
      INVALID_CREDENTIALS: "Sai tài khoản hoặc mật khẩu",
      ACCOUNT_LOCKED: "Tài khoản đang bị khóa",
      ACCOUNT_DISABLED: "Tài khoản bị vô hiệu hóa",
      EMAIL_NOT_VERIFIED: "Email chưa được xác thực",
      TOKEN_ERROR: "Lỗi mã Token bảo mật",
      UNKNOWN: "Lỗi không xác định"
    };
    return mapping[reason] || reason;
  };

  // Add Product Form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "plants" as "plants" | "care" | "nutrients" | "smarthome",
    price: "",
    stock: "",
    ecoScore: "90",
    image: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80",
    description: "",
    details: ["Xuất xứ: Lâm Đồng hữu cơ", "Chuẩn đóng gói: Túi tự hủy phân hủy sinh học"],
    specs: { "Chất liệu": "Bao bì Organic", "Dấu chân Carbon": "Thấp (-10kg CO2eq)" }
  });

  // Filtering stores
  const pendingStores = useMemo(() => {
    return dbPendingStores.length > 0 ? dbPendingStores : stores.filter((s) => !s.verified);
  }, [dbPendingStores, stores]);

  const approvedStores = useMemo(() => stores.filter((s) => s.verified), [stores]);

  const filteredApprovedStores = useMemo(() => {
    return approvedStores.filter((store) => {
      const matchesSearch = store.name.toLowerCase().includes(storeSearch.toLowerCase()) || 
                            store.ownerName.toLowerCase().includes(storeSearch.toLowerCase()) ||
                            store.ownerEmail.toLowerCase().includes(storeSearch.toLowerCase());
      const matchesCity = storeCityFilter === "" || store.city === storeCityFilter;
      return matchesSearch && matchesCity;
    });
  }, [approvedStores, storeSearch, storeCityFilter]);

  const filteredUsers = useMemo(() => {
    return dbUsers.filter((u) => {
      const matchesSearch = (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) || 
                            (u.email || "").toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === "" || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [dbUsers, userSearch, userRoleFilter]);

  const handleApproveStore = useCallback(async (storeId: string) => {
    const numericId = parseInt(storeId);
    try {
      await AdminStoreService.approveStore(numericId);
      toast.success("Duyệt hồ sơ kinh doanh của Nhà Vườn thành công!");
      updateStoreInfo(storeId, { verified: true });
      loadAllData();
    } catch (err: any) {
      toast.error(`Không thể duyệt hồ sơ: ${err.message || err}`);
    }
  }, [updateStoreInfo, loadAllData]);

  const handleRejectStore = useCallback((storeId: string) => {
    setRejectStoreId(storeId);
    setRejectStoreReason("");
    setRejectStoreError("");
    setRejectStoreOpen(true);
  }, []);

  const handleRejectStoreConfirmed = useCallback(async () => {
    if (!rejectStoreId) return;
    const trimmedReason = rejectStoreReason.trim();
    if (!trimmedReason) {
      setRejectStoreError("Vui lòng nhập lý do từ chối.");
      return;
    }
    if (trimmedReason.length > 500) {
      setRejectStoreError("Lý do từ chối không được vượt quá 500 ký tự.");
      return;
    }

    const numericId = parseInt(rejectStoreId);
    try {
      await AdminStoreService.rejectStore(numericId, trimmedReason);
      toast.success("Đã từ chối hồ sơ đăng ký kinh doanh.");
      updateStoreInfo(rejectStoreId, { verified: false, name: `${stores.find(s=>s.id === rejectStoreId)?.name} (Bị từ chối)` });
      setRejectStoreOpen(false);
      setRejectStoreId(null);
      setRejectStoreReason("");
      setRejectStoreError("");
      loadAllData();
    } catch (err: any) {
      toast.error(`Không thể từ chối hồ sơ: ${err.message || err}`);
    }
  }, [rejectStoreId, rejectStoreReason, stores, updateStoreInfo, loadAllData]);

  // Product Filtering logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                            p.description.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = productCategoryFilter === "" || p.category === productCategoryFilter;
      
      let matchesStock = true;
      if (productStockFilter === "out") matchesStock = p.stock === 0;
      else if (productStockFilter === "low") matchesStock = p.stock > 0 && p.stock < 15;
      else if (productStockFilter === "good") matchesStock = p.stock >= 15;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, productSearch, productCategoryFilter, productStockFilter]);

  // Order Filtering logic
  const filteredOrders = useMemo(() => {
    return dbOrders.filter((o) => {
      const matchesSearch = (o.customerName || "").toLowerCase().includes(orderSearch.toLowerCase()) || 
                            (o.id || "").toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus = orderStatusFilter === "" || o.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dbOrders, orderSearch, orderStatusFilter]);

  const getOrderStatusLabel = useCallback((status: string) => {
    switch (status) {
      case "processing": return "Đang gói hàng";
      case "shipped": return "Đang giao";
      case "completed": return "Đã giao thành công";
      case "cancelled": return "Đã hủy đơn";
      default: return "Chờ xử lý";
    }
  }, []);

  const getOrderStatusColor = useCallback((status: string) => {
    switch (status) {
      case "processing": return "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30";
      case "shipped": return "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30";
      case "completed": return "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30";
      case "cancelled": return "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-250 dark:border-rose-900/30";
      default: return "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-250 dark:border-stone-700";
    }
  }, []);



  const handleUpdateOrderStatus = useCallback((orderId: string, newStatus: string) => {
    toast.error("Quyền cập nhật trạng thái đơn hàng thuộc về Nhà Vườn (Store Owner).");
  }, []);

  const handleDeleteProduct = useCallback(async (productId: string | number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) {
      return;
    }
    try {
      await PlantService.deleteProductAdmin(productId);
      toast.success("Xóa sản phẩm thành công!");
      await loadProducts();
    } catch (err: any) {
      toast.error("Không thể xóa sản phẩm. Vui lòng thử lại sau.");
    }
  }, [loadProducts]);

  const handleAddProductSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      toast.error("Vui lòng nhập đầy đủ tên sản phẩm, đơn giá và số lượng kho.");
      return;
    }

    const createdProd = {
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      rating: 5.0,
      image: newProduct.image,
      description: newProduct.description || "Sản phẩm sinh thái cao cấp đạt tiêu chuẩn chứng nhận GreenLife.",
      ecoScore: parseInt(newProduct.ecoScore),
      details: newProduct.details,
      specs: newProduct.specs,
      stock: parseInt(newProduct.stock)
    };

    addNewProduct(createdProd);
    toast.success("Đã khởi tạo và đưa sản phẩm sinh thái mới lên sàn giao dịch thành công!");
    setShowAddProductModal(false);
    // Reset form
    setNewProduct({
      name: "",
      category: "plants",
      price: "",
      stock: "",
      ecoScore: "90",
      image: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80",
      description: "",
      details: ["Xuất xứ: Lâm Đồng hữu cơ", "Chuẩn đóng gói: Túi tự hủy sinh học"],
      specs: { "Chất liệu": "Bao bì Organic", "Dấu chân Carbon": "Thấp (-10kg CO2eq)" }
    });
  }, [newProduct, addNewProduct]);

  // Calculated values
  const statsMetrics = useMemo(() => {
    const totalEcoStores = stores.length;
    const verifiedStoresCount = approvedStores.length;
    const totalCarbonOffset = approvedStores.reduce((sum, s) => sum + s.carbonOffsetKg, 0);
    const totalOrderRevenue = dbOrders.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);
    return {
      totalEcoStores,
      verifiedStoresCount,
      totalCarbonOffset,
      totalOrderRevenue
    };
  }, [stores, approvedStores, dbOrders]);

  return (
    <div className="space-y-8 pb-24 text-[var(--gl-text-primary)]">
      
      {fallbackWarning && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl text-xs flex items-center gap-2.5 animate-badge-pop">
          <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 animate-pulse" />
          <span className="font-semibold">{fallbackWarning}</span>
        </div>
      )}

      {/* Intro Portal header with green luxury accent */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 rounded-3xl bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gl-accent)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--gl-accent)]"></span>
            </span>
            <span className="text-xs text-[var(--gl-accent)] font-mono tracking-widest uppercase font-semibold">ECO SYSTEM ROOT PORTAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[var(--gl-text-primary)] tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-9 w-9 text-[var(--gl-accent)] drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            Kiểm Soát Sinh Thái GreenLife
          </h1>
          <p className="text-[var(--gl-text-muted)] text-sm max-w-xl leading-relaxed">
            Hệ thống điều hành trung tâm của Admin. Quản trị phê duyệt nhà vườn, thẩm định chất lượng nông nghiệp xanh, phân phối dòng carbon tín chỉ và giám sát thanh khoản sàn.
          </p>
        </div>

        {/* Real-time server connection stats */}
        <div className="flex flex-wrap md:flex-col lg:flex-row items-start lg:items-center gap-3.5 bg-[var(--gl-bg-muted)] p-4 rounded-2xl border border-[var(--gl-border)] font-mono text-[10px] text-[var(--gl-text-muted)]">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-[var(--gl-accent)]" />
            <span>Core DB: <strong className="text-[var(--gl-accent)]">MSSQL Live</strong></span>
          </div>
          <span className="hidden lg:inline text-[var(--gl-border)]">|</span>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-[var(--gl-accent)]" />
            <span>API Gateway: <strong className="text-[var(--gl-accent)]">Online</strong></span>
          </div>
          <span className="hidden lg:inline text-[var(--gl-border)]">|</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[var(--gl-accent)] animate-pulse" />
            <span>AI Engine: <strong className="text-[var(--gl-accent)]">v1.4 Loaded</strong></span>
          </div>
        </div>
      </div>

      {/* Navigation is integrated with the main website header above */}

      {/* RENDER ACTIVE TAB */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        loadingReports ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-8 animate-slide-down">
          {/* Stats metrics scoreboard */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: `${statsMetrics.totalEcoStores} Nhà Vườn`, 
                desc: "Đại lý liên kết", 
                icon: Store, 
                sub: `${statsMetrics.verifiedStoresCount} vườn đã duyệt hoạt động`,
                color: "from-teal-500/10 to-emerald-500/5",
                badge: "Eco-Hub"
              },
              { 
                title: `${statsMetrics.totalCarbonOffset.toLocaleString("vi-VN")} kg`, 
                desc: "Carbon Khử Tích Lũy", 
                icon: Leaf, 
                sub: "Hấp thụ xanh toàn hệ thống",
                color: "from-emerald-500/10 to-lime-500/5",
                badge: "CO2 Offset",
                trend: "+15.2%"
              },
              { 
                title: `${products.length} Sản Phẩm`, 
                desc: "Danh mục trao đổi", 
                icon: Sprout, 
                sub: "Đóng gói hữu cơ 100%",
                color: "from-green-500/10 to-teal-500/5",
                badge: "Bio-Catalog"
              },
              { 
                title: `${statsMetrics.totalOrderRevenue.toLocaleString("vi-VN")}₫`, 
                desc: "Thanh khoản hệ thống", 
                icon: Coins, 
                sub: "Giao dịch phát sinh tháng này",
                color: "from-emerald-500/10 to-cyan-500/5",
                badge: "Flow-Sales",
                trend: "+24.8%"
              }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded text-[8px] bg-[var(--gl-bg-muted)] text-[var(--gl-text-muted)] font-mono tracking-wider font-bold">
                      {stat.badge}
                    </span>
                    <div className="p-2 rounded-lg bg-[var(--gl-bg-muted)] text-[var(--gl-text-secondary)] transition-colors">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-display text-[var(--gl-text-primary)] tracking-tight">{stat.title}</span>
                      {stat.trend && (
                        <span className="text-[10px] text-[var(--gl-accent)] font-bold flex items-center font-mono">
                          <TrendingUp className="h-3 w-3 inline mr-0.5" />
                          {stat.trend}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--gl-text-muted)] mt-0.5 block">{stat.desc}</span>
                  </div>
                  <div className="border-t border-[var(--gl-border)] mt-4 pt-2.5 flex items-center justify-between text-[10px] text-[var(--gl-text-muted)] font-mono">
                    <span>{stat.sub}</span>
                    <ArrowUpRight className="h-3 w-3 text-[var(--gl-text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </section>

          {/* Chart & System Status Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Growth Chart - Left 2/3 */}
            <div className="lg:col-span-2 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 rounded-3xl space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-[var(--gl-text-primary)] text-sm tracking-wider uppercase flex items-center gap-1.5">
                    <Leaf className="h-4 w-4 text-[var(--gl-accent)] animate-pulse" />
                    Hiệu Suất Khử Carbon Khu Vực Lũy Kế (Tấn CO2)
                  </h3>
                  <p className="text-[10px] text-[var(--gl-text-muted)] font-mono">Dữ liệu tổng hợp từ các chi hội nhà vườn GreenLife liên kết địa phương</p>
                </div>
              </div>
              
              <div className="h-72 w-full pt-4 flex flex-col items-center justify-center border border-dashed border-[var(--gl-border)] rounded-2xl bg-[var(--gl-bg-muted)]">
                <Leaf className="h-10 w-10 text-[var(--gl-text-muted)] mb-2" />
                <p className="text-xs text-[var(--gl-text-muted)] font-medium">Chưa có dữ liệu thống kê</p>
                <p className="text-[10px] text-[var(--gl-text-muted)] font-mono mt-1">Hệ thống đang tích lũy chỉ số carbon thực tế</p>
              </div>
            </div>

            {/* System Status & Recent Activity - Right 1/3 */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              
              {/* System Health Status Grid */}
              <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-5 rounded-3xl space-y-4 shadow-xs">
                <h3 className="font-display font-semibold text-[var(--gl-text-primary)] text-sm tracking-wider uppercase flex items-center gap-1.5">
                  <Activity className="h-4.5 w-4.5 text-[var(--gl-text-muted)]" />
                  Trạng Thái Hệ Thống
                </h3>
                
                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                  <div className="bg-[var(--gl-bg-muted)] p-3 rounded-xl border border-[var(--gl-border)] flex flex-col justify-between h-18">
                    <span className="text-[var(--gl-text-muted)]">Database Core</span>
                    <span className="flex items-center gap-1.5 text-[var(--gl-accent)] font-bold">
                      <span className="inline-block w-1.5 h-1.5 bg-[var(--gl-accent)] rounded-full animate-pulse"></span>
                      MSSQL Sync
                    </span>
                  </div>
                  <div className="bg-[var(--gl-bg-muted)] p-3 rounded-xl border border-[var(--gl-border)] flex flex-col justify-between h-18">
                    <span className="text-[var(--gl-text-muted)]">Diag Engine AI</span>
                    <span className="flex items-center gap-1.5 text-[var(--gl-accent)] font-bold">
                      <span className="inline-block w-1.5 h-1.5 bg-[var(--gl-accent)] rounded-full animate-pulse"></span>
                      94% Conf.
                    </span>
                  </div>
                  <div className="bg-[var(--gl-bg-muted)] p-3 rounded-xl border border-[var(--gl-border)] flex flex-col justify-between h-18">
                    <span className="text-[var(--gl-text-muted)]">Eco-Stripe Gateway</span>
                    <span className="flex items-center gap-1.5 text-[var(--gl-accent)] font-bold">
                      <span className="inline-block w-1.5 h-1.5 bg-[var(--gl-accent)] rounded-full animate-pulse"></span>
                      0.02s Lat.
                    </span>
                  </div>
                  <div className="bg-[var(--gl-bg-muted)] p-3 rounded-xl border border-[var(--gl-border)] flex flex-col justify-between h-18">
                    <span className="text-[var(--gl-text-muted)]">EcoScore Auditor</span>
                    <span className="flex items-center gap-1.5 text-[var(--gl-accent)] font-bold">
                      <span className="inline-block w-1.5 h-1.5 bg-[var(--gl-accent)] rounded-full animate-pulse"></span>
                      LCA Valid
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-5 rounded-3xl flex-1 space-y-4 shadow-xs">
                <h3 className="font-display font-semibold text-[var(--gl-text-primary)] text-sm tracking-wider uppercase flex items-center gap-1.5">
                  <Clock className="h-4.5 w-4.5 text-[var(--gl-text-muted)]" />
                  Nhật Ký Điều Hành
                </h3>

                <div className="flex flex-col items-center justify-center py-8 text-[var(--gl-text-muted)] font-mono text-[10px]">
                  <span>Chưa có nhật ký điều hành phát sinh</span>
                </div>
              </div>

            </div>
          </div>
        </div>
        )
      )}

      {/* 2. STORE APPROVALS */}
      {activeTab === "stores" && (
        <div className="space-y-6 animate-slide-down">
          
          {/* Sub Tab selection */}
          <div className="flex border-b border-[var(--gl-border)] gap-6">
            <button 
              type="button"
              onClick={() => setStoreTab("pending")}
              className={`pb-3 text-xs font-semibold relative cursor-pointer min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-t-lg ${
                storeTab === "pending" ? "text-[var(--gl-accent)] font-bold" : "text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)]"
              }`}
            >
              Hồ Sơ Chờ Phê Duyệt ({pendingStores.length})
              {storeTab === "pending" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--gl-accent)] rounded-full" />}
            </button>
            <button 
              type="button"
              onClick={() => setStoreTab("active")}
              className={`pb-3 text-xs font-semibold relative cursor-pointer min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-t-lg ${
                storeTab === "active" ? "text-[var(--gl-accent)] font-bold" : "text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)]"
              }`}
            >
              Cửa Hàng Đối Tác Hoạt Động ({approvedStores.length})
              {storeTab === "active" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--gl-accent)] rounded-full" />}
            </button>
          </div>

          {storeTab === "pending" ? (
            <div className="space-y-4">
              {pendingStores.length === 0 ? (
                <EmptyState
                  icon={Sprout}
                  title="Không có yêu cầu duyệt"
                  description="🌱 Không có hồ sơ nhà vườn nào đang xếp hàng chờ duyệt. Hệ sinh thái đang ở trạng thái ổn định!"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingStores.map((store) => (
                    <div key={store.id} className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl p-6 flex flex-col gap-4 shadow-xs hover:border-[var(--gl-accent)]/40 transition-all duration-300">
                      
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <img src={getMediaUrl(store.avatar) || "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=100"} alt={store.name} className="w-11 h-11 object-cover rounded-xl border border-[var(--gl-border)]" />
                          <div>
                            <h4 className="text-xs font-bold text-[var(--gl-text-primary)] leading-snug">{store.name}</h4>
                            <p className="text-[10px] text-[var(--gl-text-muted)] mt-0.5">Chủ vườn: {store.ownerName} ({store.ownerEmail})</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] bg-amber-500/10 text-amber-500 font-mono uppercase font-bold border border-amber-500/20 animate-pulse">
                          Chờ Duyệt
                        </span>
                      </div>

                      <div className="space-y-2 text-[10px] font-mono text-[var(--gl-text-muted)] border-y border-[var(--gl-border)] py-3 my-1">
                        <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-[var(--gl-text-muted)]" /> <span>📍 {store.address}</span></p>
                        <p className="flex items-center gap-1.5"><ShoppingBag className="h-3 w-3 text-[var(--gl-text-muted)]" /> <span>Quy mô đăng ký: {store.productsCount} mặt hàng thảo dược/kiểng lá</span></p>
                        {(store as any).businessType && (
                          <p className="flex items-center gap-1.5 font-bold text-[var(--gl-accent)]">
                            <span>🏢 Hình thức: {(store as any).businessType === "PHYSICAL_STORE" ? "Có cửa hàng trực tiếp" : "Kinh doanh online / nhà vườn đóng gói"}</span>
                          </p>
                        )}
                      </div>

                      {/* KYC & Business Evidence Inspection */}
                      {((store as any).cccdFrontUrl || (store as any).verificationDocument || ((store as any).businessEvidenceUrls && (store as any).businessEvidenceUrls.length > 0)) && (
                        <div className="space-y-2 bg-[var(--gl-bg-muted)] p-3 rounded-xl border border-[var(--gl-border)] text-[10px]">
                          <span className="font-bold text-[var(--gl-text-primary)] block font-mono">Hồ sơ Định danh KYC & Minh chứng (Bảo mật Admin):</span>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {((store as any).cccdFrontUrl || (store as any).verificationDocument) && (
                              <SecureKycImage url={(store as any).cccdFrontUrl || (store as any).verificationDocument} alt="CCCD Mặt trước" />
                            )}
                            {(store as any).cccdBackUrl && (
                              <SecureKycImage url={(store as any).cccdBackUrl} alt="CCCD Mặt sau" />
                            )}
                            {(store as any).businessEvidenceUrls && (store as any).businessEvidenceUrls.map((evUrl: string, evIdx: number) => (
                              <SecureKycImage key={evIdx} url={evUrl} alt={`Minh chứng ${evIdx + 1}`} />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] text-[var(--gl-text-secondary)] leading-relaxed bg-[var(--gl-bg-muted)] p-3.5 rounded-xl border border-[var(--gl-border)]">
                        <div className="flex items-center gap-1 text-[9px] text-[var(--gl-accent)] font-bold uppercase mb-1">
                          <Leaf className="h-3 w-3" />
                          Cam Kết Bảo Vệ Môi Trường
                        </div>
                        Nhà vườn cam kết cung ứng các giống thực vật nuôi trồng 100% hữu cơ, sử dụng chậu nung và túi sơ dừa tự hủy ép nén. Tuyệt đối không phân phối thuốc hóa học trừ sâu hay các loại bao bì nhựa PP gây ô nhiễm.
                      </div>

                      <div className="flex gap-3.5 pt-2 mt-auto">
                        <button
                          type="button"
                          onClick={() => handleApproveStore(store.id)}
                          className="flex-1 py-2.5 min-h-[40px] bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-black font-semibold rounded-xl text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-all uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Phê Duyệt Hồ Sơ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectStore(store.id)}
                          className="py-2.5 px-4 min-h-[40px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold rounded-xl text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-all uppercase border border-rose-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                        >
                          <X className="h-3.5 w-3.5" />
                          Từ Chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 rounded-3xl space-y-5 shadow-xs">
              
              {/* Search and filter controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--gl-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Tìm tên nhà vườn, email, chủ vườn..."
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 min-h-[40px] text-xs rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono"
                  />
                </div>
                <div className="relative w-full sm:w-48">
                  <Filter className="absolute left-3 top-3 h-4 w-4 text-[var(--gl-text-muted)]" />
                  <select
                    value={storeCityFilter}
                    onChange={(e) => setStoreCityFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 min-h-[40px] text-xs rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono cursor-pointer"
                  >
                    <option value="" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Tất cả tỉnh thành</option>
                    <option value="Hà Nội" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Hà Nội</option>
                    <option value="Lâm Đồng" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Lâm Đồng</option>
                    <option value="Đà Nẵng" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Đà Nẵng</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto text-xs rounded-xl border border-[var(--gl-border)]">
                <table className="w-full text-left text-[var(--gl-text-secondary)] border-collapse">
                  <thead className="bg-[var(--gl-bg-muted)] border-b border-[var(--gl-border)] text-[var(--gl-text-muted)] uppercase font-mono text-[9px]">
                    <tr>
                      <th className="p-4.5">Tên Nhà Vườn</th>
                      <th className="p-4.5">Đại Diện Pháp Nhân</th>
                      <th className="p-4.5">Khu Vực TP</th>
                      <th className="p-4.5 text-center">Carbon Offset</th>
                      <th className="p-4.5 text-center">Mặt hàng</th>
                      <th className="p-4.5 text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--gl-border)]">
                    {filteredApprovedStores.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8">
                          <EmptyState
                            icon={Sprout}
                            title="Không tìm thấy nhà vườn"
                            description="Không tìm thấy nhà vườn nào khớp với điều kiện tìm kiếm."
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredApprovedStores.map((store) => (
                        <tr key={store.id} className="hover:bg-[var(--gl-bg-muted)]/50 transition-colors">
                          <td className="p-4.5">
                            <div className="flex items-center gap-2.5">
                              <img src={getMediaUrl(store.avatar) || "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=100"} alt={store.name} className="w-7 h-7 object-cover rounded-md" />
                              <div>
                                <span className="font-semibold text-[var(--gl-text-primary)] block">{store.name}</span>
                                <span className="text-[9px] text-[var(--gl-text-muted)] font-mono block">ID: {store.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4.5">
                            <div className="space-y-0.5">
                              <span className="block">{store.ownerName}</span>
                              <span className="text-[10px] text-[var(--gl-text-muted)] font-mono block">{store.ownerEmail}</span>
                            </div>
                          </td>
                          <td className="p-4.5 font-mono">{store.city}</td>
                          <td className="p-4.5 text-center font-mono font-bold text-[var(--gl-accent)]">
                            {store.carbonOffsetKg} kg
                          </td>
                          <td className="p-4.5 text-center font-mono">{store.productsCount} món</td>
                          <td className="p-4.5 text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[8px] bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] font-mono font-bold uppercase border border-[var(--gl-accent)]/20">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. USER MANAGEMENT TAB */}
      {activeTab === "users" && (
        <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 rounded-3xl space-y-5 shadow-xs animate-slide-down">
          
          {/* Header & filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-[var(--gl-text-primary)] text-sm tracking-wider uppercase">
                Quản Lý Thành Viên Cổng Hệ Thống
              </h3>
              <p className="text-[10px] text-[var(--gl-text-muted)]">Giám sát tài khoản, hạn mức Carbon Credits tích lũy, đổi thưởng xanh và quyền phân vai điều hành.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--gl-text-muted)]" />
                <input
                  type="text"
                  placeholder="Tìm họ tên, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 min-h-[40px] text-xs rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-3 h-4 w-4 text-[var(--gl-text-muted)]" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full sm:w-48 pl-9 pr-4 py-2 min-h-[40px] text-xs rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono cursor-pointer"
                >
                  <option value="" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Tất cả chức vụ</option>
                  <option value="admin" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Quản trị viên (Admin)</option>
                  <option value="store" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Chủ cửa hàng (Store)</option>
                  <option value="customer" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Khách hàng (Customer)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto text-xs rounded-xl border border-[var(--gl-border)]">
            <table className="w-full text-left text-[var(--gl-text-secondary)] border-collapse">
              <thead className="bg-[var(--gl-bg-muted)] border-b border-[var(--gl-border)] text-[var(--gl-text-muted)] uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-4.5">Tên thành viên</th>
                  <th className="p-4.5">Liên hệ</th>
                  <th className="p-4.5 text-center">Hạn Mức Tín chỉ</th>
                  <th className="p-4.5 text-center">Carbon Khử (Saved)</th>
                  <th className="p-4.5">Vai Trò</th>
                  <th className="p-4.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gl-border)]">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={6} className="p-4">
                      <TableSkeleton rows={5} cols={6} />
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8">
                      <EmptyState
                        icon={Users}
                        title="Không tìm thấy thành viên"
                        description="Không tìm thấy thành viên nào phù hợp."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => (
                  <tr key={idx} className="hover:bg-[var(--gl-bg-muted)]/50 transition-colors">
                    <td className="p-4.5 font-semibold text-[var(--gl-text-primary)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] flex items-center justify-center font-bold font-display border border-[var(--gl-accent)]/20">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <span className="block">{u.name}</span>
                          <span className={`text-[8px] font-mono font-bold uppercase ${u.status === "Active" ? "text-[var(--gl-accent)]" : "text-rose-500"}`}>
                            ● {u.status}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4.5 font-mono">
                      <div className="space-y-0.5 text-[10px]">
                        <span className="block text-[var(--gl-text-muted)] min-w-0 break-all">{u.email}</span>
                        <span className="block text-[var(--gl-text-muted)]">{u.phone}</span>
                      </div>
                    </td>
                    <td className="p-4.5 text-center font-mono font-bold text-[var(--gl-text-primary)]">
                      {u.credits.toLocaleString("vi-VN")} CPT
                    </td>
                    <td className="p-4.5 text-center font-mono font-bold text-[var(--gl-accent)]">
                      -{u.carbonSaved} kg CO2
                    </td>
                    <td className="p-4.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider font-mono uppercase ${
                        u.role === "admin"
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          : u.role === "store"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4.5 text-right">
                      <button 
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className="py-1.5 px-3 min-h-[40px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] text-[var(--gl-text-primary)] font-semibold rounded-lg text-[10px] cursor-pointer transition-all flex items-center gap-1 ml-auto border border-[var(--gl-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                      >
                        <Eye className="h-3 w-3" /> Xem hồ sơ
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PRODUCT MANAGEMENT TAB */}
      {activeTab === "products" && (
        <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 rounded-3xl space-y-5 shadow-xs animate-slide-down">
          
          {/* Header row & Add product */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-[var(--gl-text-primary)] text-sm tracking-wider uppercase">
                Danh Mục Mặt Hàng Niêm Yết Sàn
              </h3>
              <p className="text-[10px] text-[var(--gl-text-muted)]">Giám sát lượng hàng, định giá chênh lệch, chấm điểm EcoScore cho bao bì và nguồn gốc sản phẩm.</p>
            </div>
            
            <button
              type="button"
              onClick={() => setShowAddProductModal(true)}
              className="py-2.5 px-4 min-h-[44px] bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs uppercase self-start lg:self-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
            >
              <Plus className="h-4 w-4" />
              Thêm Sản Phẩm Sinh Thái
            </button>
          </div>

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--gl-text-muted)]" />
              <input
                type="text"
                placeholder="Tìm tên sản phẩm, công dụng..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 min-h-[40px] text-xs rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-3 h-4 w-4 text-[var(--gl-text-muted)]" />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 min-h-[40px] text-xs rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono cursor-pointer"
                >
                  <option value="" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Mọi danh mục</option>
                  <option value="plants" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Cây Cảnh (plants)</option>
                  <option value="nutrients" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Dinh Dưỡng (nutrients)</option>
                  <option value="care" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Chăm Sóc (care)</option>
                  <option value="smarthome" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Eco-IoT SmartHome</option>
                </select>
              </div>
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-3 h-4 w-4 text-[var(--gl-text-muted)]" />
                <select
                  value={productStockFilter}
                  onChange={(e) => setProductStockFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 min-h-[40px] text-xs rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono cursor-pointer"
                >
                  <option value="" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Lượng kho</option>
                  <option value="out" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Đã hết hàng</option>
                  <option value="low" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Sắp hết hàng (&lt; 15)</option>
                  <option value="good" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Lượng kho dồi dào (&gt;= 15)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto text-xs rounded-xl border border-[var(--gl-border)]">
            <table className="w-full text-left text-[var(--gl-text-secondary)] border-collapse">
              <thead className="bg-[var(--gl-bg-muted)] border-b border-[var(--gl-border)] text-[var(--gl-text-muted)] uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-4.5">Sản Phẩm</th>
                  <th className="p-4.5">Danh Mục</th>
                  <th className="p-4.5 text-center">Định Giá VND</th>
                  <th className="p-4.5 text-center">Chỉ Số EcoScore</th>
                  <th className="p-4.5 text-center">Trạng Thái Kho</th>
                  <th className="p-4.5 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gl-border)]">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8">
                      <EmptyState
                        icon={Sprout}
                        title="Không tìm thấy sản phẩm"
                        description="Không tìm thấy sản phẩm nào phù hợp bộ lọc."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isOutOfStock = p.stock === 0;
                    const isLowStock = p.stock > 0 && p.stock < 15;
                    return (
                      <tr key={p.id} className="hover:bg-[var(--gl-bg-muted)]/50 transition-colors">
                        <td className="p-4.5">
                          <div className="flex items-center gap-3">
                            <img src={getMediaUrl(p.image)} alt={p.name} className="w-9 h-9 object-cover rounded-lg border border-[var(--gl-border)]" />
                            <div className="space-y-0.5">
                              <span className="font-semibold text-[var(--gl-text-primary)] block">{p.name}</span>
                              <span className="text-[10px] text-[var(--gl-text-muted)] block">⭐ {p.rating} | Đánh giá tốt</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[8px] bg-[var(--gl-bg-muted)] text-[var(--gl-text-muted)] font-mono uppercase border border-[var(--gl-border)]">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-4.5 text-center font-mono font-bold text-[var(--gl-accent)]">
                          {p.price.toLocaleString("vi-VN")}₫
                        </td>
                        <td className="p-4.5 text-center font-mono">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold text-[var(--gl-text-primary)]">{p.ecoScore}/100</span>
                            <div className="w-12 h-1.5 rounded-full bg-[var(--gl-bg-muted)] overflow-hidden hidden sm:block">
                              <div className="h-full bg-[var(--gl-accent)] rounded-full" style={{ width: `${p.ecoScore}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4.5 text-center font-mono">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            isOutOfStock
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              : isLowStock
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20"
                          }`}>
                            {isOutOfStock ? "Hết Hàng" : isLowStock ? `Hạn Chế (${p.stock})` : `Đủ hàng (${p.stock})`}
                          </span>
                        </td>
                        <td className="p-4.5 text-right">
                          <button 
                            type="button"
                            aria-label="Xóa sản phẩm"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 min-w-[40px] min-h-[40px] text-[var(--gl-text-muted)] hover:text-[var(--gl-danger)] hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ORDER MANAGEMENT TAB */}
      {activeTab === "orders" && (
        <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 rounded-3xl space-y-5 shadow-xs animate-slide-down">
          
          {/* Header row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-[var(--gl-text-primary)] text-sm tracking-wider uppercase">
                Quản Lý Các Giao Dịch Đơn Hàng Sàn
              </h3>
              <p className="text-[10px] text-[var(--gl-text-muted)]">Xem hóa đơn thanh khoản, cập nhật lộ trình giao vận, và tính toán hệ số carbon giảm thiểu gián tiếp.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--gl-text-muted)]" />
                <input
                  type="text"
                  placeholder="Mã đơn, tên khách hàng..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 min-h-[40px] text-xs rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-3 h-4 w-4 text-[var(--gl-text-muted)]" />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="w-full sm:w-48 pl-9 pr-4 py-2 min-h-[40px] text-xs rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono cursor-pointer"
                >
                  <option value="" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Tất cả trạng thái</option>
                  <option value="pending" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Chờ xử lý (pending)</option>
                  <option value="processing" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Đang đóng gói (processing)</option>
                  <option value="shipped" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Đang giao vận (shipped)</option>
                  <option value="completed" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Đã giao thành công</option>
                  <option value="cancelled" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Đã hủy đơn</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto text-xs rounded-xl border border-[var(--gl-border)]">
            <table className="w-full text-left text-[var(--gl-text-secondary)] border-collapse">
              <thead className="bg-[var(--gl-bg-muted)] border-b border-[var(--gl-border)] text-[var(--gl-text-muted)] uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-4.5">Mã Giao Dịch</th>
                  <th className="p-4.5">Tên Người Nhận</th>
                  <th className="p-4.5 font-mono">Ngày Phát Sinh</th>
                  <th className="p-4.5 text-center">Số lượng</th>
                  <th className="p-4.5 text-center font-mono">Tổng Thu VND</th>
                  <th className="p-4.5 text-center">Trạng Thái</th>
                  <th className="p-4.5 text-right">Thẩm Định</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gl-border)]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8">
                      <EmptyState
                        icon={ShoppingBag}
                        title="Không tìm thấy đơn hàng"
                        description="Không tìm thấy mã đơn hàng phù hợp bộ lọc."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-[var(--gl-bg-muted)]/50 transition-colors">
                      <td className="p-4.5 font-mono font-bold text-[var(--gl-text-primary)]">{o.id}</td>
                      <td className="p-4.5">{o.customerName}</td>
                      <td className="p-4.5 font-mono text-[var(--gl-text-muted)]">{o.date}</td>
                      <td className="p-4.5 text-center font-mono">{o.itemsCount} sản phẩm</td>
                      <td className="p-4.5 text-center font-mono font-bold text-[var(--gl-accent)]">
                        {o.total.toLocaleString("vi-VN")}₫
                      </td>
                      <td className="p-4.5 text-center font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getOrderStatusColor(o.status)}`}>
                          {getOrderStatusLabel(o.status)}
                        </span>
                      </td>
                      <td className="p-4.5 text-right">
                        <button 
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="py-1.5 px-3 min-h-[40px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] text-[var(--gl-text-primary)] font-semibold rounded-lg text-[10px] cursor-pointer transition-all flex items-center gap-1 ml-auto border border-[var(--gl-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                        >
                          <FileText className="h-3 w-3" /> Chi tiết đơn
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. BLOG MANAGEMENT TAB */}
      {activeTab === "blogs" && (
        <AdminBlogModerationSection products={products} />
      )}

      {/* 8. REVIEW MODERATION TAB */}
      {activeTab === "reviews" && (
        <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 rounded-3xl space-y-5 shadow-xs animate-slide-down">
          <div>
            <h3 className="font-display font-semibold text-[var(--gl-text-primary)] text-sm tracking-wider uppercase">
              Kiểm Duyệt Đánh Giá Khách Hàng
            </h3>
            <p className="text-[10px] text-[var(--gl-text-muted)]">Giám sát và kiểm duyệt các đánh giá của người dùng đối với sản phẩm/nhà vườn.</p>
          </div>

          <div className="overflow-x-auto text-xs rounded-xl border border-[var(--gl-border)]">
            <table className="w-full text-left text-[var(--gl-text-secondary)] border-collapse">
              <thead className="bg-[var(--gl-bg-muted)] border-b border-[var(--gl-border)] text-[var(--gl-text-muted)] uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-4.5">Người đánh giá</th>
                  <th className="p-4.5">Đối tượng</th>
                  <th className="p-4.5 text-center">Đánh giá</th>
                  <th className="p-4.5">Bình luận</th>
                  <th className="p-4.5 text-center">Thời gian</th>
                  <th className="p-4.5 text-center">Trạng thái</th>
                  <th className="p-4.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gl-border)]">
                {loadingReviews ? (
                  <tr>
                    <td colSpan={7} className="p-4">
                      <TableSkeleton rows={5} cols={7} />
                    </td>
                  </tr>
                ) : reviewsError ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-rose-500 font-medium font-mono">
                      {reviewsError}
                    </td>
                  </tr>
                ) : dbReviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8">
                      <EmptyState
                        icon={MessageSquare}
                        title="Không có đánh giá"
                        description="Hệ thống chưa ghi nhận đánh giá nào."
                      />
                    </td>
                  </tr>
                ) : (
                  dbReviews.map((r) => (
                    <tr key={r.id} className="hover:bg-[var(--gl-bg-muted)]/50 transition-colors">
                      <td className="p-4.5 font-semibold text-[var(--gl-text-primary)]">
                        {r.customerDisplayName || "Khách Hàng ẩn danh"}
                      </td>
                      <td className="p-4.5 font-mono text-[10px]">
                        {r.plantId ? (
                          <span className="text-[var(--gl-accent)]">Sản phẩm (ID: {r.plantId})</span>
                        ) : r.storeId ? (
                          <span className="text-teal-500">Nhà vườn (ID: {r.storeId})</span>
                        ) : (
                          <span className="text-[var(--gl-text-muted)]">Không rõ</span>
                        )}
                      </td>
                      <td className="p-4.5 text-center font-mono text-amber-500 font-bold">
                        {"★".repeat(r.rating || 5)}{"☆".repeat(5 - (r.rating || 5))}
                      </td>
                      <td className="p-4.5 max-w-xs truncate" title={r.comment}>
                        {r.comment || <em className="text-[var(--gl-text-muted)]">Không có nội dung</em>}
                      </td>
                      <td className="p-4.5 text-center font-mono text-[10px] text-[var(--gl-text-muted)]">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString("vi-VN") : "N/A"}
                      </td>
                      <td className="p-4.5 text-center font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          r.status === "VISIBLE" ? "bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        }`}>
                          {r.status === "VISIBLE" ? "Đang Hiện" : "Đã Ẩn"}
                        </span>
                      </td>
                      <td className="p-4.5 text-right">
                        <button
                          type="button"
                          disabled={moderatingId === r.id}
                          onClick={() => handleModerateReview(r.id, r.status)}
                          className={`py-1.5 px-3 min-h-[40px] rounded-lg text-[10px] font-semibold transition-all border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
                            r.status === "VISIBLE"
                              ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20"
                              : "bg-[var(--gl-accent-soft)] hover:bg-[var(--gl-accent)]/20 text-[var(--gl-accent)] border-[var(--gl-accent)]/20"
                          } disabled:opacity-50`}
                        >
                          {moderatingId === r.id ? "Đang xử lý..." : r.status === "VISIBLE" ? "Ẩn Đánh Giá" : "Hiện Đánh Giá"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {reviewsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[var(--gl-border)]">
              <span className="text-[10px] text-[var(--gl-text-muted)] font-mono">
                Trang {reviewsPage + 1} / {reviewsTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={reviewsPage === 0 || loadingReviews}
                  onClick={() => fetchReviews(reviewsPage - 1)}
                  className="py-1.5 px-3 min-h-[40px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] disabled:opacity-40 text-[var(--gl-text-primary)] font-semibold rounded-lg text-[10px] cursor-pointer transition-all border border-[var(--gl-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={reviewsPage >= reviewsTotalPages - 1 || loadingReviews}
                  onClick={() => fetchReviews(reviewsPage + 1)}
                  className="py-1.5 px-3 min-h-[40px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] disabled:opacity-40 text-[var(--gl-text-primary)] font-semibold rounded-lg text-[10px] cursor-pointer transition-all border border-[var(--gl-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. SECURITY LOGIN LOGS TAB */}
      {activeTab === "security-logs" && (
        <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 rounded-3xl space-y-6 shadow-xs animate-slide-down">
          
          {/* Title Block */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-[var(--gl-text-primary)] text-sm tracking-wider uppercase flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Nhật Ký Bảo Mật Hệ Thống
              </h3>
              <p className="text-[10px] text-[var(--gl-text-muted)]">Giám sát các hoạt động đăng nhập thành công và nỗ lực truy cập thất bại.</p>
            </div>
          </div>

          {/* Filter & Controls Panel */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--gl-bg-muted)] p-4 rounded-2xl border border-[var(--gl-border)] text-xs">
            {/* Mode Tabs */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setAuditFilterMode("all"); handleResetUserId(); }}
                className={`px-3 py-1.5 min-h-[40px] rounded-lg font-semibold transition-all cursor-pointer border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
                  auditFilterMode === "all" && appliedUserIdFilter === null
                    ? "bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border-[var(--gl-accent)]/20"
                    : "text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] border-[var(--gl-border)] bg-[var(--gl-bg-surface)]"
                }`}
              >
                Tất cả đăng nhập
              </button>
              <button
                type="button"
                onClick={() => { setAuditFilterMode("failed"); handleResetUserId(); }}
                className={`px-3 py-1.5 min-h-[40px] rounded-lg font-semibold transition-all cursor-pointer border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
                  auditFilterMode === "failed" && appliedUserIdFilter === null
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    : "text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] border-[var(--gl-border)] bg-[var(--gl-bg-surface)]"
                }`}
              >
                Nỗ lực thất bại
              </button>
            </div>

            {/* User ID Query Input */}
            <form onSubmit={handleSearchUserId} className="flex gap-2 items-center w-full md:w-auto">
              <input
                type="text"
                placeholder="Nhập mã User ID..."
                value={auditUserIdFilter}
                onChange={(e) => setAuditUserIdFilter(e.target.value)}
                className="w-full md:w-48 min-h-[40px] bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] text-xs font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 min-h-[40px] bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-black font-semibold rounded-lg cursor-pointer transition-all shrink-0 uppercase text-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
              >
                Lọc
              </button>
              {appliedUserIdFilter !== null && (
                <button
                  type="button"
                  onClick={handleResetUserId}
                  className="px-2.5 py-1.5 min-h-[40px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] text-[var(--gl-text-muted)] rounded-lg cursor-pointer transition-all shrink-0 text-[10px] border border-[var(--gl-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Hủy
                </button>
              )}
            </form>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto text-xs rounded-xl border border-[var(--gl-border)]">
            <table className="w-full text-left text-[var(--gl-text-secondary)] border-collapse">
              <thead className="bg-[var(--gl-bg-muted)] border-b border-[var(--gl-border)] text-[var(--gl-text-muted)] uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-4.5">Thời gian</th>
                  <th className="p-4.5">Tài khoản (Email)</th>
                  <th className="p-4.5 text-center">User ID</th>
                  <th className="p-4.5 text-center">Sự kiện</th>
                  <th className="p-4.5 text-center">Trạng thái</th>
                  <th className="p-4.5">Lý do lỗi</th>
                  <th className="p-4.5">Địa chỉ IP</th>
                  <th className="p-4.5">Thiết bị (User Agent)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gl-border)]">
                {auditsLoading ? (
                  <tr>
                    <td colSpan={8} className="p-4">
                      <TableSkeleton rows={5} cols={8} />
                    </td>
                  </tr>
                ) : auditsError ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-rose-500 font-medium font-mono">
                      {auditsError}
                    </td>
                  </tr>
                ) : audits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8">
                      <EmptyState
                        icon={ShieldAlert}
                        title="Không có bản ghi"
                        description="Không tìm thấy nhật ký bảo mật nào phù hợp."
                      />
                    </td>
                  </tr>
                ) : (
                  audits.map((a) => (
                    <tr key={a.id} className="hover:bg-[var(--gl-bg-muted)]/50 transition-colors">
                      <td className="p-4.5 font-mono text-[10px]">
                        {a.timestamp ? new Date(a.timestamp).toLocaleString("vi-VN") : "N/A"}
                      </td>
                      <td className="p-4.5 font-semibold text-[var(--gl-text-primary)]">
                        {a.email}
                      </td>
                      <td className="p-4.5 text-center font-mono text-[10px]">
                        {a.userId !== null ? a.userId : <span className="text-[var(--gl-text-muted)]">Khách</span>}
                      </td>
                      <td className="p-4.5 text-center font-semibold text-[var(--gl-text-secondary)] font-mono text-[10px]">
                        Login
                      </td>
                      <td className="p-4.5 text-center font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          a.success
                            ? "bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20"
                            : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        }`}>
                          {a.success ? "Thành công" : "Thất bại"}
                        </span>
                      </td>
                      <td className="p-4.5">
                        {a.success ? (
                          <span className="text-[var(--gl-text-muted)]">-</span>
                        ) : (
                          <span className="text-rose-500 font-medium">{getFailureReasonLabel(a.failureReason)}</span>
                        )}
                      </td>
                      <td className="p-4.5 font-mono text-[10px] text-[var(--gl-text-muted)]">
                        {a.ipAddress || "N/A"}
                      </td>
                      <td className="p-4.5 max-w-[200px] truncate text-[var(--gl-text-muted)]" title={a.userAgent}>
                        {a.userAgent || "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {auditsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[var(--gl-border)]">
              <span className="text-[10px] text-[var(--gl-text-muted)] font-mono">
                Trang {auditsPage + 1} / {auditsTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={auditsPage === 0 || auditsLoading}
                  onClick={() => fetchLoginAudits(auditsPage - 1)}
                  className="py-1.5 px-3 min-h-[40px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] disabled:opacity-40 text-[var(--gl-text-primary)] font-semibold rounded-lg text-[10px] cursor-pointer transition-all border border-[var(--gl-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={auditsPage >= auditsTotalPages - 1 || auditsLoading}
                  onClick={() => fetchLoginAudits(auditsPage + 1)}
                  className="py-1.5 px-3 min-h-[40px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] disabled:opacity-40 text-[var(--gl-text-primary)] font-semibold rounded-lg text-[10px] cursor-pointer transition-all border border-[var(--gl-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 10. PROMOTIONS MANAGEMENT TAB */}
      {activeTab === "promotions" && (
        <AdminPromotionsTab />
      )}

      {/* ==================== MODALS & POPUPS SYSTEM ==================== */}

      {/* 1. Add Product Eco Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] w-full max-w-2xl rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative my-8 animate-slide-down max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain">
            
            <button 
              type="button"
              aria-label="Đóng"
              onClick={() => setShowAddProductModal(false)}
              className="absolute right-4.5 top-4.5 p-2 rounded-full bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-[var(--gl-accent)] font-bold uppercase tracking-widest block">LAUNCH ECOLOGICAL PRODUCT</span>
              <h3 className="text-xl md:text-2xl font-display font-bold text-[var(--gl-text-primary)] flex items-center gap-2">
                <Sprout className="h-6 w-6 text-[var(--gl-accent)]" />
                Thêm Sản Phẩm Sinh Thái Mới
              </h3>
              <p className="text-[11px] text-[var(--gl-text-muted)]">Khởi tạo mã sản phẩm xanh mới lên sàn giao dịch nông nghiệp sinh học GreenLife.</p>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="text-[var(--gl-text-muted)] block font-semibold">Tên sản phẩm sinh thái *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đất nung Bát Tràng tơi xốp"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 min-h-[40px] rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-[var(--gl-text-muted)] block font-semibold">Nhóm danh mục *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full p-3 min-h-[40px] rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono cursor-pointer"
                  >
                    <option value="plants" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Cây Xanh Bản Địa (plants)</option>
                    <option value="nutrients" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Chất Dinh Dưỡng Hữu Cơ (nutrients)</option>
                    <option value="care" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Chăm Sóc & Sinh Học (care)</option>
                    <option value="smarthome" className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">Hệ Thống Smart-IoT (smarthome)</option>
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-[var(--gl-text-muted)] block font-semibold">Đơn giá bán niêm yết (VND) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 150000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full p-3 min-h-[40px] rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono"
                  />
                </div>

                {/* Stock */}
                <div className="space-y-1">
                  <label className="text-[var(--gl-text-muted)] block font-semibold">Số lượng nhập kho ban đầu *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 50"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full p-3 min-h-[40px] rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono"
                  />
                </div>

                {/* EcoScore */}
                <div className="space-y-1">
                  <label className="text-[var(--gl-text-muted)] block font-semibold">Chỉ số thân thiện EcoScore (1-100) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    placeholder="Ví dụ: 95"
                    value={newProduct.ecoScore}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, ecoScore: e.target.value }))}
                    className="w-full p-3 min-h-[40px] rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-1">
                  <label className="text-[var(--gl-text-muted)] block font-semibold">Đường dẫn hình ảnh minh họa (URL)</label>
                  <input
                    type="text"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full p-3 min-h-[40px] rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-mono text-[10px]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[var(--gl-text-muted)] block font-semibold">Mô tả đặc tính sinh thái sản phẩm</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả các tiêu chí đạt organic, khả năng tự phân hủy của bao bì vỏ ngoài..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] font-sans"
                />
              </div>

              <div className="flex gap-4.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-3 min-h-[44px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] font-bold rounded-xl cursor-pointer transition-colors border border-[var(--gl-border)] uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 min-h-[44px] bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-black font-bold rounded-xl cursor-pointer transition-all shadow-xs uppercase border border-[var(--gl-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Khởi Tạo Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. User Detail Profile Card Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-slide-down max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain">
            
            <button 
              type="button"
              aria-label="Đóng"
              onClick={() => setSelectedUser(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="w-16 h-16 rounded-full bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] flex items-center justify-center text-2xl font-bold font-display shadow-inner border border-[var(--gl-accent)]/20">
                {selectedUser.name.charAt(0)}
              </div>
              
              <div className="space-y-1">
                <h3 className="font-display font-bold text-[var(--gl-text-primary)] text-lg leading-tight">{selectedUser.name}</h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20 uppercase">
                  {selectedUser.role}
                </span>
              </div>

              {/* Bio block */}
              <p className="text-[11px] text-[var(--gl-text-muted)] leading-relaxed max-w-xs italic">
                &ldquo;Thành viên tích cực tham gia cổng trao đổi nông sinh học và tích trữ chỉ số carbon danh dự.&rdquo;
              </p>

              {/* Metrics scoring board */}
              <div className="grid grid-cols-2 gap-4 w-full bg-[var(--gl-bg-muted)] p-4 rounded-2xl border border-[var(--gl-border)] text-left font-mono">
                <div>
                  <span className="text-[9px] text-[var(--gl-text-muted)] uppercase block">Ví Tín Chỉ Carbon</span>
                  <span className="text-sm font-bold text-[var(--gl-text-primary)] block mt-0.5 flex items-center gap-1">
                    <Coins className="h-4 w-4 text-amber-500" />
                    {selectedUser.credits.toLocaleString()} CPT
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-[var(--gl-text-muted)] uppercase block">Carbon Đã Khử</span>
                  <span className="text-sm font-bold text-[var(--gl-accent)] block mt-0.5 flex items-center gap-1">
                    <Leaf className="h-4 w-4" />
                    -{selectedUser.carbonSaved} kg CO2
                  </span>
                </div>
                <div className="col-span-2 border-t border-[var(--gl-border)] pt-2 mt-1">
                  <span className="text-[9px] text-[var(--gl-text-muted)] uppercase block">Mã định danh liên kết</span>
                  <span className="text-[10px] text-[var(--gl-text-secondary)] block mt-0.5 font-mono truncate">{selectedUser.email}</span>
                  <span className="text-[10px] text-[var(--gl-text-secondary)] block font-mono">SDT: {selectedUser.phone}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Cấp thành công chứng thư danh dự sinh thái 500 CPT Credits tặng thành viên!");
                    setSelectedUser(null);
                  }}
                  className="flex-1 py-2.5 min-h-[40px] bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-black font-semibold rounded-xl text-[10px] uppercase font-mono tracking-wider transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Tặng Carbon Credits
                </button>
                <button
                  type="button"
                  disabled={selectedUser.status === "Pending" || selectedUser.status === "Disabled"}
                  onClick={async () => {
                    const userId = parseInt(selectedUser.id);
                    const isCurrentlyActive = selectedUser.status === "Active";
                    const isLocked = selectedUser.status === "Locked" || selectedUser.status === "Blocked";

                    const actionWord = isCurrentlyActive ? "khóa" : "mở khóa";
                    try {
                      if (isCurrentlyActive) {
                        await AdminUserService.lockUser(userId);
                      } else if (isLocked) {
                        await AdminUserService.unlockUser(userId);
                      }
                      toast.success(`Đã ${actionWord} tài khoản của ${selectedUser.name} thành công.`);
                      loadAllData();
                    } catch (err: any) {
                      toast.error(`Không thể ${actionWord} tài khoản: ${err.message || err}`);
                    }
                    setSelectedUser(null);
                  }}
                  className={`py-2.5 px-4 min-h-[40px] font-semibold rounded-xl text-[10px] uppercase font-mono tracking-wider transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
                    (selectedUser.status === "Pending" || selectedUser.status === "Disabled")
                      ? "bg-[var(--gl-bg-muted)] text-[var(--gl-text-muted)] border-[var(--gl-border)] cursor-not-allowed opacity-50"
                      : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20 cursor-pointer"
                  }`}
                >
                  {selectedUser.status === "Active" 
                    ? "KHÓA TÀI KHOẢN" 
                    : (selectedUser.status === "Locked" || selectedUser.status === "Blocked") 
                      ? "MỞ KHÓA" 
                      : "KÍCH HOẠT"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Detailed Order Invoice Drawer Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative animate-slide-down max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain">
            
            <button 
              type="button"
              aria-label="Đóng"
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4.5 top-4.5 p-1.5 rounded-full bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="space-y-1 pb-4 border-b border-[var(--gl-border)]">
              <span className="text-[8px] font-mono text-[var(--gl-accent)] font-bold uppercase tracking-widest">TRANSACTION INVOICE AUDIT</span>
              <h3 className="text-base font-display font-bold text-[var(--gl-text-primary)] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[var(--gl-accent)]" />
                Hóa Đơn Chi Tiết: {selectedOrder.id}
              </h3>
              <p className="text-[10px] text-[var(--gl-text-muted)] font-mono">Khách hàng: {selectedOrder.customerName} | Ngày đặt: {selectedOrder.date}</p>
            </div>

            {/* List of items purchased */}
            <div className="my-5 space-y-3.5 max-h-52 overflow-y-auto pr-1">
              <span className="text-[9px] text-[var(--gl-text-muted)] font-mono uppercase block tracking-wider">Danh mục giỏ hàng thanh khoản</span>
              
              {loadingOrderDetails ? (
                <div className="text-center text-xs text-[var(--gl-text-muted)] font-mono py-6 animate-pulse">Đang tải chi tiết đơn hàng...</div>
              ) : selectedOrderDetails && selectedOrderDetails.length > 0 ? (
                selectedOrderDetails.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-4 bg-[var(--gl-bg-muted)] p-2.5 rounded-xl border border-[var(--gl-border)] text-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={getMediaUrl(item.img)} alt={item.name} className="w-8 h-8 object-cover rounded-md" />
                      <div>
                        <span className="font-semibold text-[var(--gl-text-primary)] block max-w-xs truncate">{item.name}</span>
                        <span className="text-[10px] text-[var(--gl-text-muted)] font-mono block">Số lượng: x{item.qty}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[var(--gl-text-primary)]">
                      {(item.price * item.qty).toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-[var(--gl-text-muted)] font-mono py-6">Không tìm thấy chi tiết đơn hàng.</div>
              )}
            </div>

            {/* Cost breakdown metrics & CO2 offset weight */}
            <div className="bg-[var(--gl-bg-muted)] p-4 rounded-2xl border border-[var(--gl-border)] space-y-2 text-[11px] font-mono">
              <div className="flex justify-between text-[var(--gl-text-muted)]">
                <span>Giá trị giỏ hàng:</span>
                <span>{(selectedOrder.total - 30000).toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex justify-between text-[var(--gl-text-muted)]">
                <span>Bao bì phân hủy & Ship:</span>
                <span>30,000₫</span>
              </div>
              <div className="border-t border-[var(--gl-border)] pt-2 flex justify-between font-bold text-[var(--gl-text-primary)]">
                <span>Tổng chi trả thực:</span>
                <span className="text-[var(--gl-accent)]">{selectedOrder.total.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="bg-[var(--gl-accent-soft)] border border-[var(--gl-accent)]/20 p-2.5 rounded-xl flex items-center justify-between text-[10px] text-[var(--gl-accent)] mt-2">
                <span className="flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5 animate-pulse" /> Giảm CO2 tương đương:</span>
                <span className="font-bold">-{selectedOrder.itemsCount * 12} kg CO2</span>
              </div>
            </div>

            {/* Action Area: Update transaction routing path (Read Only) */}
            <div className="mt-6 pt-4 border-t border-[var(--gl-border)] flex flex-col gap-3">
              <span className="text-[9px] text-[var(--gl-text-muted)] font-mono uppercase block">Trạng thái lộ trình giao vận (Chỉ đọc)</span>
              
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "processing", label: "Đóng Gói" },
                  { key: "shipped", label: "Vận Chuyển" },
                  { key: "completed", label: "Giao Thành Công" },
                  { key: "cancelled", label: "Hủy Đơn" }
                ].map((st) => {
                  const isCurrent = selectedOrder.status === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      disabled
                      className={`py-1.5 px-3 min-h-[40px] rounded-lg text-[9px] font-mono uppercase tracking-wider font-semibold cursor-not-allowed opacity-50 transition-all ${
                        isCurrent
                          ? "bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/30"
                          : "bg-[var(--gl-bg-muted)] text-[var(--gl-text-muted)] border border-[var(--gl-border)]"
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal for Store Profile */}
      {rejectStoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative text-left max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain">
            <button
              type="button"
              aria-label="Đóng"
              onClick={() => {
                setRejectStoreOpen(false);
                setRejectStoreId(null);
                setRejectStoreReason("");
                setRejectStoreError("");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-[var(--gl-bg-muted)] text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--gl-text-primary)] font-display">
                Từ chối hồ sơ cửa hàng
              </h3>
            </div>

            <div className="text-xs text-[var(--gl-text-secondary)] leading-relaxed font-sans space-y-3">
              <p>Vui lòng nhập lý do từ chối để cửa hàng có thể theo dõi và cập nhật lại hồ sơ.</p>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[var(--gl-text-muted)] block uppercase tracking-wider">Lý do từ chối *</label>
                <textarea
                  required
                  rows={4}
                  value={rejectStoreReason}
                  onChange={(e) => {
                    setRejectStoreReason(e.target.value);
                    if (e.target.value.trim()) {
                      setRejectStoreError("");
                    }
                  }}
                  placeholder="Ví dụ: Hồ sơ chưa đáp ứng tiêu chuẩn sinh thái hoặc thiếu thông tin xác minh."
                  className="w-full p-3 bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] rounded-xl text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] transition-all text-xs"
                />
                {rejectStoreError && (
                  <span className="text-rose-500 text-[10px] block font-semibold">{rejectStoreError}</span>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectStoreOpen(false);
                  setRejectStoreId(null);
                  setRejectStoreReason("");
                  setRejectStoreError("");
                }}
                className="flex-1 py-2.5 min-h-[40px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] rounded-xl text-xs font-semibold cursor-pointer transition-all border border-[var(--gl-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRejectStoreConfirmed}
                className="flex-1 py-2.5 min-h-[40px] text-white bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

interface AdminBlogModerationSectionProps {
  products: Product[];
}

const AdminBlogModerationSection: React.FC<AdminBlogModerationSectionProps> = ({ products }) => {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<any | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRevisions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ArticleService.getAdminBlogs(undefined, undefined, "PENDING_REVIEW");
      setRevisions(res.content);
    } catch (err: any) {
      toast.error("Lỗi khi tải danh sách bài viết duyệt: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  const handleAction = async (action: "approve" | "request-changes" | "reject" | "archive") => {
    if (!selectedRevision) return;

    if ((action === "request-changes" || action === "reject") && !comment.trim()) {
      toast.error("Vui lòng nhập lý do/phản hồi để gửi cho tác giả.");
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (action === "approve") {
        res = await ArticleService.approveBlog(selectedRevision.id, selectedRevision.version, comment);
      } else if (action === "request-changes") {
        res = await ArticleService.requestChanges(selectedRevision.id, selectedRevision.version, comment);
      } else if (action === "reject") {
        res = await ArticleService.rejectBlog(selectedRevision.id, selectedRevision.version, comment);
      } else if (action === "archive") {
        res = await ArticleService.archiveBlog(selectedRevision.id);
      }

      if (res) {
        toast.success("Đã thực hiện thao tác kiểm duyệt thành công.");
        setSelectedRevision(null);
        setComment("");
        await fetchRevisions();
      } else {
        toast.error("Thao tác thất bại.");
      }
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_REVIEW":
        return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold rounded font-mono uppercase">Chờ Duyệt</span>;
      case "CHANGES_REQUESTED":
        return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold rounded font-mono uppercase">Yêu Cầu Sửa</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold rounded font-mono uppercase">Từ Chối</span>;
      default:
        return <span className="px-2 py-0.5 bg-[var(--gl-bg-muted)] text-[var(--gl-text-muted)] border border-[var(--gl-border)] text-[10px] font-bold rounded font-mono uppercase">{status}</span>;
    }
  };

  return (
    <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 sm:p-8 rounded-3xl space-y-6 shadow-xs animate-slide-down">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--gl-border)] pb-5">
        <div>
          <h2 className="font-display font-semibold text-[var(--gl-text-primary)] text-lg uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--gl-accent)]" />
            Kiểm Duyệt Cẩm Nang Xanh
          </h2>
          <p className="text-xs text-[var(--gl-text-muted)] mt-1">
            Xét duyệt các bài viết hướng dẫn, cẩm nang sinh thái từ Khách hàng và Chủ vườn trước khi xuất bản chính thức.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchRevisions}
          className="px-4 py-2 min-h-[40px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-border)] text-[var(--gl-text-primary)] rounded-xl text-xs font-bold uppercase transition-all tracking-wider border border-[var(--gl-border)] flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
        >
          <Clock className="w-4 h-4" /> Làm Mới
        </button>
      </div>

      {selectedRevision ? (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => {
              setSelectedRevision(null);
              setComment("");
            }}
            className="flex items-center gap-1 min-h-[40px] text-xs text-[var(--gl-text-muted)] hover:text-[var(--gl-accent)] font-semibold cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại danh sách
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] p-5 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[var(--gl-text-muted)] font-mono block">
                      Tác giả: <strong className="text-[var(--gl-text-primary)]">{selectedRevision.authorName}</strong> ({selectedRevision.authorRole === "STORE_OWNER" ? "Chủ Vườn" : "Khách Hàng"})
                    </span>
                    <span className="text-[10px] text-[var(--gl-text-muted)] font-mono block">
                      Thời gian gửi: {selectedRevision.submittedAt ? new Date(selectedRevision.submittedAt).toLocaleString("vi-VN") : "N/A"}
                    </span>
                  </div>
                  <div>
                    {getStatusBadge(selectedRevision.status)}
                  </div>
                </div>
              </div>

              {selectedRevision.previousPublished ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] p-5 rounded-2xl space-y-4 opacity-75">
                    <span className="px-2 py-0.5 bg-[var(--gl-bg-surface)] text-[var(--gl-text-muted)] text-[9px] font-bold rounded font-mono uppercase tracking-wider">Phiên Bản Hiện Tại</span>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[var(--gl-text-primary)] text-sm">{selectedRevision.previousPublished.title}</h4>
                      <p className="text-xs text-[var(--gl-text-muted)] italic">Summary: {selectedRevision.previousPublished.summary}</p>
                      {selectedRevision.previousPublished.image && (
                        <img 
                          src={selectedRevision.previousPublished.image} 
                          alt="Published thumbnail" 
                          className="w-full h-32 object-cover rounded-xl border border-[var(--gl-border)]"
                        />
                      )}
                      <div 
                        className="text-xs text-[var(--gl-text-secondary)] leading-relaxed font-sans prose prose-sm dark:prose-invert break-words max-h-96 overflow-y-auto pr-1"
                        dangerouslySetInnerHTML={{ __html: selectedRevision.previousPublished.content }}
                      />
                    </div>
                  </div>

                  <div className="bg-[var(--gl-bg-muted)] border border-[var(--gl-accent)]/20 p-5 rounded-2xl space-y-4 shadow-xs ring-1 ring-[var(--gl-accent)]/10">
                    <span className="px-2 py-0.5 bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] text-[9px] font-bold rounded font-mono uppercase tracking-wider">Bản Đang Đề Xuất Duyệt</span>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[var(--gl-text-primary)] text-sm">{selectedRevision.title}</h4>
                      <p className="text-xs text-[var(--gl-text-secondary)] italic">Summary: {selectedRevision.summary}</p>
                      {selectedRevision.image && (
                        <img 
                          src={selectedRevision.image} 
                          alt="Submission thumbnail" 
                          className="w-full h-32 object-cover rounded-xl border border-[var(--gl-border)]"
                        />
                      )}
                      <div 
                        className="text-xs text-[var(--gl-text-primary)] leading-relaxed font-sans prose prose-sm dark:prose-invert break-words max-h-96 overflow-y-auto pr-1"
                        dangerouslySetInnerHTML={{ __html: selectedRevision.content }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] p-6 rounded-2xl space-y-5">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20 rounded-xl text-[10px] font-mono font-semibold uppercase">
                    <Leaf className="w-3.5 h-3.5" /> Bài viết gieo mầm mới (Không có phiên bản xuất bản trước đó)
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[var(--gl-text-muted)] font-mono block uppercase">Tiêu đề bài viết</span>
                      <h3 className="font-display font-bold text-[var(--gl-text-primary)] text-base">{selectedRevision.title}</h3>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-[var(--gl-text-muted)] font-mono block uppercase">Tóm tắt (Summary)</span>
                      <p className="text-xs text-[var(--gl-text-secondary)] italic leading-relaxed">{selectedRevision.summary}</p>
                    </div>

                    {selectedRevision.image && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-[var(--gl-text-muted)] font-mono block uppercase">Ảnh Thumbnail</span>
                        <img 
                          src={selectedRevision.image} 
                          alt="Article thumbnail" 
                          className="max-h-64 object-cover rounded-xl border border-[var(--gl-border)]"
                        />
                      </div>
                    )}

                    <div className="space-y-2 pt-4 border-t border-[var(--gl-border)]">
                      <span className="text-[10px] text-[var(--gl-text-muted)] font-mono block uppercase">Nội dung chi tiết</span>
                      <div 
                        className="text-xs text-[var(--gl-text-primary)] leading-relaxed font-sans prose prose-sm dark:prose-invert break-words max-h-96 overflow-y-auto pr-2"
                        dangerouslySetInnerHTML={{ __html: selectedRevision.content }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] p-4 rounded-2xl space-y-3">
                <span className="text-[10px] text-[var(--gl-text-muted)] font-mono block uppercase font-semibold flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[var(--gl-accent)]" /> Sản phẩm gắn tag ({selectedRevision.taggedProductIds?.length || 0})
                </span>
                {selectedRevision.taggedProductIds && selectedRevision.taggedProductIds.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedRevision.taggedProductIds.map((pId: string) => {
                      const prod = products.find(p => p.id === pId);
                      if (!prod) return null;
                      return (
                        <div key={pId} className="flex items-center gap-2 p-2 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-xl">
                          <img src={getMediaUrl(prod.image)} alt={prod.name} className="w-8 h-8 object-cover rounded" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-[10px] block truncate text-[var(--gl-text-primary)]">{prod.name}</span>
                            <span className="text-[9px] text-[var(--gl-text-muted)] font-mono">{prod.price.toLocaleString("vi-VN")}₫</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-[var(--gl-text-muted)] italic">Không gắn kèm sản phẩm nào.</p>
                )}
              </div>

              <div className="bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] p-4 rounded-2xl space-y-3">
                <span className="text-[10px] text-[var(--gl-text-muted)] font-mono block uppercase font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--gl-accent)]" /> Lịch sử kiểm duyệt
                </span>
                {selectedRevision.moderationHistory && selectedRevision.moderationHistory.length > 0 ? (
                  <div className="space-y-3 pl-2 border-l border-[var(--gl-border)] max-h-48 overflow-y-auto pr-1">
                    {selectedRevision.moderationHistory.map((hist: any, index: number) => (
                      <div key={hist.id || index} className="space-y-1 relative pl-3.5">
                        <div className="absolute top-1 left-[-4.5px] w-2 h-2 rounded-full bg-[var(--gl-accent)]" />
                        <div className="flex justify-between items-center text-[9px] text-[var(--gl-text-muted)] font-mono">
                          <span>{hist.moderatorName || "Admin"}</span>
                          <span>{hist.moderatedAt ? new Date(hist.moderatedAt).toLocaleDateString("vi-VN") : "N/A"}</span>
                        </div>
                        <p className="text-[10px] text-[var(--gl-text-primary)] font-bold uppercase tracking-tight">
                          {hist.action === "APPROVE" ? "Đã duyệt" : hist.action === "REQUEST_CHANGES" ? "Yêu cầu sửa" : hist.action === "REJECT" ? "Từ chối" : hist.action}
                        </p>
                        {hist.comment && (
                          <p className="text-[10px] text-[var(--gl-text-muted)] italic bg-[var(--gl-bg-surface)] p-1.5 rounded-lg border border-[var(--gl-border)] leading-normal">
                            "{hist.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-[var(--gl-text-muted)] italic">Chưa có lịch sử kiểm duyệt nào.</p>
                )}
              </div>

              <div className="bg-[var(--gl-bg-muted)] p-4 border border-[var(--gl-border)] rounded-2xl space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[var(--gl-text-muted)] font-mono block uppercase font-bold">
                    Ý kiến phản hồi / Ghi chú từ chối *
                  </label>
                  <textarea
                    placeholder="Nhập lý do từ chối, ý kiến góp ý chỉnh sửa bài viết... (Bắt buộc đối với yêu cầu sửa đổi hoặc từ chối)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full text-xs p-3 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] rounded-xl focus:outline-none focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] h-28 resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--gl-border)]">
                  <button
                    type="button"
                    onClick={() => handleAction("approve")}
                    disabled={submitting}
                    className="w-full py-2.5 min-h-[40px] bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] disabled:opacity-50 text-black text-xs font-bold uppercase rounded-xl cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5 tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                  >
                    {submitting ? <Clock className="animate-spin w-4.5 h-4.5" /> : <CheckCircle2 className="w-4.5 h-4.5" />} Duyệt & Xuất Bản
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAction("request-changes")}
                      disabled={submitting}
                      className="py-2.5 min-h-[40px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[10px] font-bold uppercase rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                    >
                      Yêu Cầu Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction("reject")}
                      disabled={submitting}
                      className="py-2.5 min-h-[40px] bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-[10px] font-bold uppercase rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                    >
                      Từ Chối
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAction("archive")}
                    disabled={submitting}
                    className="w-full py-2 min-h-[40px] bg-[var(--gl-bg-surface)] hover:bg-[var(--gl-border)] disabled:opacity-50 text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] text-[10px] font-bold uppercase rounded-xl cursor-pointer transition-all border border-[var(--gl-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                  >
                    Lưu Trữ Bài Viết
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : revisions.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Không có bài viết chờ duyệt"
              description="Hệ thống hiện tại sạch sẽ, không có bài viết nào đang nằm trong hàng đợi kiểm duyệt."
            />
          ) : (
            <div className="overflow-x-auto text-xs rounded-xl border border-[var(--gl-border)]">
              <table className="w-full text-left text-[var(--gl-text-secondary)] border-collapse">
                <thead className="bg-[var(--gl-bg-muted)] border-b border-[var(--gl-border)] text-[var(--gl-text-muted)] uppercase font-mono text-[9px]">
                  <tr>
                    <th className="p-4.5">Tiêu Đề Đề Xuất</th>
                    <th className="p-4.5">Chuyên Mục</th>
                    <th className="p-4.5">Tác Giả</th>
                    <th className="p-4.5 text-center">Ngày Đệ Trình</th>
                    <th className="p-4.5 text-center">Trạng Thái</th>
                    <th className="p-4.5 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--gl-border)]">
                  {revisions.map((rev) => {
                    const categoryNames = {
                      "plant-care": "Y Học Bệnh Cây",
                      "urban-farming": "Nông Nghiệp Đô Thị",
                      "eco-living": "Lối Sống Xanh"
                    };

                    return (
                      <tr key={rev.id} className="hover:bg-[var(--gl-bg-muted)]/50 transition-colors">
                        <td className="p-4.5 font-bold text-[var(--gl-text-primary)] max-w-sm truncate" title={rev.title}>
                          {rev.title}
                        </td>
                        <td className="p-4.5 font-semibold text-[10px] text-[var(--gl-text-muted)]">
                          {categoryNames[rev.category] || rev.category}
                        </td>
                        <td className="p-4.5">
                          <div className="space-y-0.5">
                            <span className="block font-semibold text-[var(--gl-text-primary)]">{rev.authorName}</span>
                            <span className="block text-[8px] font-mono uppercase tracking-wider text-[var(--gl-text-muted)]">{rev.authorRole === "STORE_OWNER" ? "Chủ Vườn" : "Khách Hàng"}</span>
                          </div>
                        </td>
                        <td className="p-4.5 text-center font-mono text-[10px]">
                          {rev.submittedAt ? new Date(rev.submittedAt).toLocaleDateString("vi-VN") : "N/A"}
                        </td>
                        <td className="p-4.5 text-center font-mono">
                          {getStatusBadge(rev.status)}
                        </td>
                        <td className="p-4.5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedRevision(rev)}
                            className="py-1.5 px-3 min-h-[40px] bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-black font-bold rounded-lg text-[10px] uppercase cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                          >
                            Thẩm Định <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
