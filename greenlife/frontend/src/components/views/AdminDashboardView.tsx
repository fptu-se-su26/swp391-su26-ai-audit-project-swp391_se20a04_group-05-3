import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
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
  Leaf
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { INITIAL_ORDERS } from "../../data";

export const AdminDashboardView: React.FC = () => {
  const { 
    stores, 
    products, 
    appointments, 
    updateStoreInfo,
    addNewProduct,
    setCurrentPage,
    adminActiveTab,
    setAdminActiveTab,
    deleteProduct,
    users,
    awardUserCredits,
    toggleUserStatus
  } = useAppContext();

  // Reference context state directly
  const activeTab = adminActiveTab;
  const setActiveTab = setAdminActiveTab;

  // Local state for orders & appointments to simulate real-time admin workflow updates
  const [localOrders, setLocalOrders] = useState(INITIAL_ORDERS);
  const [localAppointments, setLocalAppointments] = useState(appointments);

  // Search & Filter States
  const [storeTab, setStoreTab] = useState<"pending" | "active">("pending");
  const [storeSearch, setStoreSearch] = useState("");
  const [storeCityFilter, setStoreCityFilter] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");

  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productStockFilter, setProductStockFilter] = useState(""); // "all" | "out" | "low" | "good"

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");

  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");

  // Modals & Details states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

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

  // Recharts carbon reduction mock dataset
  const offsetHistory = [
    { year: "2021", LamDong: 80, HaNoi: 20, DaNang: 12 },
    { year: "2022", LamDong: 150, HaNoi: 45, DaNang: 30 },
    { year: "2023", LamDong: 220, HaNoi: 95, DaNang: 65 },
    { year: "2024", LamDong: 380, HaNoi: 160, DaNang: 110 },
    { year: "2025", LamDong: 540, HaNoi: 280, DaNang: 190 },
    { year: "2026", LamDong: 720, HaNoi: 450, DaNang: 320 }
  ];

  // Filtering stores
  const pendingStores = stores.filter((s) => !s.verified);
  const approvedStores = stores.filter((s) => s.verified);

  const filteredApprovedStores = approvedStores.filter((store) => {
    const matchesSearch = store.name.toLowerCase().includes(storeSearch.toLowerCase()) || 
                          store.ownerName.toLowerCase().includes(storeSearch.toLowerCase()) ||
                          store.ownerEmail.toLowerCase().includes(storeSearch.toLowerCase());
    const matchesCity = storeCityFilter === "" || store.city === storeCityFilter;
    return matchesSearch && matchesCity;
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === "" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleApproveStore = (storeId: string) => {
    updateStoreInfo(storeId, { verified: true });
    alert("Duyệt hồ sơ kinh doanh của Nhà Vườn thành công! Đối tác đã chính thức hoạt động trên GreenLife.");
  };

  const handleRejectStore = (storeId: string) => {
    if (confirm("Bạn có chắc chắn muốn từ chối hồ sơ này?")) {
      updateStoreInfo(storeId, { verified: false, name: `${stores.find(s=>s.id === storeId)?.name} (Bị từ chối)` });
      alert("Đã từ chối hồ sơ đăng ký kinh doanh.");
    }
  };

  // Product Filtering logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.description.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === "" || p.category === productCategoryFilter;
    
    let matchesStock = true;
    if (productStockFilter === "out") matchesStock = p.stock === 0;
    else if (productStockFilter === "low") matchesStock = p.stock > 0 && p.stock < 15;
    else if (productStockFilter === "good") matchesStock = p.stock >= 15;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Order Filtering logic
  const filteredOrders = localOrders.filter((o) => {
    const matchesSearch = o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) || 
                          o.id.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === "" || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Booking Filtering logic
  const filteredAppointments = localAppointments.filter((a) => {
    const matchesSearch = a.expertName.toLowerCase().includes(bookingSearch.toLowerCase()) || 
                          a.title.toLowerCase().includes(bookingSearch.toLowerCase());
    const matchesStatus = bookingStatusFilter === "" || a.status === bookingStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case "processing": return "Đang gói hàng";
      case "shipped": return "Đang giao";
      case "completed": return "Đã giao thành công";
      case "cancelled": return "Đã hủy đơn";
      default: return "Chờ xử lý";
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "processing": return "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30";
      case "shipped": return "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30";
      case "completed": return "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30";
      case "cancelled": return "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-250 dark:border-rose-900/30";
      default: return "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-250 dark:border-stone-700";
    }
  };

  // Mock product mapping for orders
  const getOrderItems = (orderId: string) => {
    if (orderId === "GL-9524") {
      return [
        { name: "Sen Đá Đô La Cẩm Thạch (Premium)", qty: 1, price: 120000, img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&auto=format&fit=crop&q=80" },
        { name: "Phân Trùn Quế Cao Cấp GreenLife Organic", qty: 2, price: 95000, img: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=100&auto=format&fit=crop&q=80" },
        { name: "Chế Phẩm Sinh Học Trừ Sâu Neem Ép Lạnh", qty: 1, price: 150000, img: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=100&auto=format&fit=crop&q=80" }
      ];
    }
    if (orderId === "GL-9523") {
      return [
        { name: "Sen Đá Đô La Cẩm Thạch (Premium)", qty: 1, price: 120000, img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&auto=format&fit=crop&q=80" }
      ];
    }
    if (orderId === "GL-9522") {
      return [
        { name: "Cây Trầu Bà Đế Vương Xanh (Noble Green)", qty: 2, price: 320000, img: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=100&auto=format&fit=crop&q=80" },
        { name: "Cảm Biến Độ Ẩm Smart-Grow IoT", qty: 1, price: 410000, img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&auto=format&fit=crop&q=80" }
      ];
    }
    return [
      { name: "Hệ Thống Đèn LED Solar Sun-Mimic 120W", qty: 1, price: 300000, img: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=100&auto=format&fit=crop&q=80" }
    ];
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
    setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, status: newStatus } : prev);
  };

  const handleUpdateBookingStatus = (bookingId: string, newStatus: "pending" | "confirmed" | "completed") => {
    setLocalAppointments(prev => prev.map(a => a.id === bookingId ? { ...a, status: newStatus } : a));
    alert(`Đã cập nhật trạng thái lịch tư vấn thành: ${newStatus === "confirmed" ? "Đã xác nhận" : "Đã hoàn thành"}`);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      alert("Vui lòng nhập đầy đủ tên sản phẩm, đơn giá và số lượng kho.");
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
    alert("Đã khởi tạo và đưa sản phẩm sinh thái mới lên sàn giao dịch thành công!");
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
  };

  // Calculated values
  const totalEcoStores = stores.length;
  const verifiedStoresCount = approvedStores.length;
  const totalCarbonOffset = approvedStores.reduce((sum, s) => sum + s.carbonOffsetKg, 0);
  const totalOrderRevenue = localOrders.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-8 pb-24 text-stone-850 dark:text-stone-100">
      
      {/* Intro Portal header with green luxury accent */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 rounded-3xl bg-linear-to-br from-emerald-500/5 via-stone-950/20 to-transparent border border-stone-200/50 dark:border-stone-850/40 shadow-xs backdrop-blur-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-500 font-mono tracking-widest uppercase font-semibold">ECO SYSTEM ROOT PORTAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-9 w-9 text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            Kiểm Soát Sinh Thái GreenLife
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm max-w-xl leading-relaxed">
            Hệ thống điều hành trung tâm của Admin. Quản trị phê duyệt nhà vườn, thẩm định chất lượng nông nghiệp xanh, phân phối dòng carbon tín chỉ và giám sát thanh khoản sàn.
          </p>
        </div>

        {/* Real-time server connection stats */}
        <div className="flex flex-wrap md:flex-col lg:flex-row items-start lg:items-center gap-3.5 bg-stone-900/5 dark:bg-stone-950/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-850 font-mono text-[10px] text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-emerald-500" />
            <span>Core DB: <strong className="text-emerald-500 dark:text-emerald-400">MSSQL Live</strong></span>
          </div>
          <span className="hidden lg:inline text-stone-300 dark:text-stone-800">|</span>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span>API Gateway: <strong className="text-emerald-500 dark:text-emerald-400">Online</strong></span>
          </div>
          <span className="hidden lg:inline text-stone-300 dark:text-stone-800">|</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>AI Engine: <strong className="text-emerald-500 dark:text-emerald-400">v1.4 Loaded</strong></span>
          </div>
        </div>
      </div>

      {/* Navigation is integrated with the main website header above */}

      {/* RENDER ACTIVE TAB */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-slide-down">
          {/* Stats metrics scoreboard */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: `${totalEcoStores} Nhà Vườn`, 
                desc: "Đại lý liên kết", 
                icon: Store, 
                sub: `${verifiedStoresCount} vườn đã duyệt hoạt động`,
                color: "from-teal-500/10 to-emerald-500/5",
                badge: "Eco-Hub"
              },
              { 
                title: `${totalCarbonOffset.toLocaleString("vi-VN")} kg`, 
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
                title: `${totalOrderRevenue.toLocaleString("vi-VN")}₫`, 
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
                <div key={idx} className={`group bg-linear-to-br ${stat.color} bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300`}>
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded text-[8px] bg-stone-200 dark:bg-stone-900 text-stone-500 dark:text-stone-400 font-mono tracking-wider font-bold">
                      {stat.badge}
                    </span>
                    <div className="p-2 rounded-lg bg-stone-200/50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition-colors">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-display text-stone-900 dark:text-stone-100 tracking-tight">{stat.title}</span>
                      {stat.trend && (
                        <span className="text-[10px] text-emerald-500 font-bold flex items-center font-mono">
                          <TrendingUp className="h-3 w-3 inline mr-0.5" />
                          {stat.trend}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 block">{stat.desc}</span>
                  </div>
                  <div className="border-t border-stone-200/60 dark:border-stone-850/50 mt-4 pt-2.5 flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                    <span>{stat.sub}</span>
                    <ArrowUpRight className="h-3 w-3 text-stone-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </section>

          {/* Chart & System Status Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Growth Chart - Left 2/3 */}
            <div className="lg:col-span-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase flex items-center gap-1.5">
                    <Leaf className="h-4 w-4 text-emerald-500 animate-pulse" />
                    Hiệu Suất Khử Carbon Khu Vực Lũy Kế (Tấn CO2)
                  </h3>
                  <p className="text-[10px] text-stone-400 font-mono">Dữ liệu tổng hợp từ các chi hội nhà vườn GreenLife liên kết địa phương</p>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-stone-400 bg-stone-100 dark:bg-stone-900 px-2.5 py-1 rounded-lg">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  Lâm Đồng
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-2"></span>
                  Hà Nội
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-2"></span>
                  Đà Nẵng
                </div>
              </div>
              
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={offsetHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLamDong" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorHaNoi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDaNang" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#88888812" strokeDasharray="3 3" />
                    <XAxis dataKey="year" stroke="#666" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis stroke="#666" fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "var(--stone-950)", 
                        borderColor: "var(--stone-850)", 
                        borderRadius: "16px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                        backdropFilter: "blur(8px)" 
                      }}
                      labelStyle={{ color: "var(--stone-200)", fontSize: "11px", fontWeight: "bold", fontFamily: "var(--font-mono)" }}
                      itemStyle={{ fontSize: "12px", padding: "2px 0" }}
                    />
                    <Area type="monotone" dataKey="LamDong" stroke="#10b981" fillOpacity={1} fill="url(#colorLamDong)" strokeWidth={2} name="Lâm Đồng (Chuyên canh)" />
                    <Area type="monotone" dataKey="HaNoi" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHaNoi)" strokeWidth={1.5} name="Ban Công Hà Nội" />
                    <Area type="monotone" dataKey="DaNang" stroke="#f59e0b" fillOpacity={1} fill="url(#colorDaNang)" strokeWidth={1.5} name="Đà Nẵng Xanh" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Status & Recent Activity - Right 1/3 */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              
              {/* System Health Status Grid */}
              <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-5 rounded-3xl space-y-4 shadow-xs">
                <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase flex items-center gap-1.5">
                  <Activity className="h-4.5 w-4.5 text-stone-400" />
                  Trạng Thái Hệ Thống
                </h3>
                
                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                  <div className="bg-stone-100 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200 dark:border-stone-850 flex flex-col justify-between h-18">
                    <span className="text-stone-400">Database Core</span>
                    <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                      <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      MSSQL Sync
                    </span>
                  </div>
                  <div className="bg-stone-100 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200 dark:border-stone-850 flex flex-col justify-between h-18">
                    <span className="text-stone-400">Diag Engine AI</span>
                    <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                      <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      94% Conf.
                    </span>
                  </div>
                  <div className="bg-stone-100 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200 dark:border-stone-850 flex flex-col justify-between h-18">
                    <span className="text-stone-400">Eco-Stripe Gateway</span>
                    <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                      <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      0.02s Lat.
                    </span>
                  </div>
                  <div className="bg-stone-100 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200 dark:border-stone-850 flex flex-col justify-between h-18">
                    <span className="text-stone-400">EcoScore Auditor</span>
                    <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                      <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      LCA Valid
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-5 rounded-3xl flex-1 space-y-4 shadow-xs">
                <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase flex items-center gap-1.5">
                  <Clock className="h-4.5 w-4.5 text-stone-400" />
                  Nhật Ký Điều Hành
                </h3>

                <div className="space-y-3.5 text-[11px] leading-relaxed">
                  {[
                    { time: "21:05", desc: "ThS. Nguyễn Thành Trung hoàn thành tư vấn ca #BK-9021.", tag: "Booking" },
                    { time: "20:46", desc: "Đơn hàng #GL-9524 thanh toán thành công 570,000₫.", tag: "Order" },
                    { time: "19:30", desc: "Nhà Vườn Thảo Mộc vừa cập nhật số lượng kho Sen Đá.", tag: "Inventory" },
                    { time: "18:15", desc: "Yêu cầu liên kết mới từ Hợp tác xã Hòa Vang gửi tới hệ thống.", tag: "Partner" }
                  ].map((act, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <span className="font-mono text-stone-400 text-[10px] pt-0.5">{act.time}</span>
                      <div className="space-y-0.5 flex-1">
                        <p className="text-stone-650 dark:text-stone-300">{act.desc}</p>
                        <span className="inline-block px-1.5 py-0.2 bg-stone-100 dark:bg-stone-900 text-stone-400 font-mono text-[8px] rounded uppercase border border-stone-200 dark:border-stone-800">
                          {act.tag}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. STORE APPROVALS */}
      {activeTab === "stores" && (
        <div className="space-y-6 animate-slide-down">
          
          {/* Sub Tab selection */}
          <div className="flex border-b border-stone-200 dark:border-stone-850 gap-6">
            <button 
              onClick={() => setStoreTab("pending")}
              className={`pb-3 text-xs font-semibold relative cursor-pointer ${
                storeTab === "pending" ? "text-emerald-500 font-bold" : "text-stone-400 hover:text-stone-300"
              }`}
            >
              Hồ Sơ Chờ Phê Duyệt ({pendingStores.length})
              {storeTab === "pending" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />}
            </button>
            <button 
              onClick={() => setStoreTab("active")}
              className={`pb-3 text-xs font-semibold relative cursor-pointer ${
                storeTab === "active" ? "text-emerald-500 font-bold" : "text-stone-400 hover:text-stone-300"
              }`}
            >
              Cửa Hàng Đối Tác Hoạt Động ({approvedStores.length})
              {storeTab === "active" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />}
            </button>
          </div>

          {storeTab === "pending" ? (
            <div className="space-y-4">
              {pendingStores.length === 0 ? (
                <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-12 text-center text-stone-500 text-xs rounded-3xl shadow-xs">
                  🌱 Không có hồ sơ nhà vườn nào đang xếp hàng chờ duyệt. Hệ sinh thái đang ở trạng thái ổn định!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingStores.map((store) => (
                    <div key={store.id} className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:border-emerald-500/40 transition-all duration-300">
                      
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <img src={store.avatar || "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=100"} alt={store.name} className="w-11 h-11 object-cover rounded-xl border border-stone-200 dark:border-stone-800" />
                          <div>
                            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">{store.name}</h4>
                            <p className="text-[10px] text-stone-400 mt-0.5">Chủ vườn: {store.ownerName} ({store.ownerEmail})</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-mono uppercase font-bold border border-amber-250 dark:border-amber-900/30 animate-pulse">
                          Chờ Duyệt
                        </span>
                      </div>

                      <div className="space-y-2 text-[10px] font-mono text-stone-500 border-y border-stone-200/50 dark:border-stone-850/50 py-3 my-1">
                        <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-stone-400" /> <span>📍 {store.address}</span></p>
                        <p className="flex items-center gap-1.5"><ShoppingBag className="h-3 w-3 text-stone-400" /> <span>Quy mô đăng ký: {store.productsCount} mặt hàng thảo dược/kiểng lá</span></p>
                      </div>

                      <div className="text-[10px] text-stone-650 dark:text-stone-400 leading-relaxed bg-stone-100 dark:bg-stone-900/50 p-3.5 rounded-xl border border-stone-200 dark:border-stone-850">
                        <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold uppercase mb-1">
                          <Leaf className="h-3 w-3" />
                          Cam Kết Bảo Vệ Môi Trường
                        </div>
                        Nhà vườn cam kết cung ứng các giống thực vật nuôi trồng 100% hữu cơ, sử dụng chậu nung và túi sơ dừa tự hủy ép nén. Tuyệt đối không phân phối thuốc hóa học trừ sâu hay các loại bao bì nhựa PP gây ô nhiễm.
                      </div>

                      <div className="flex gap-3.5 pt-2 mt-auto">
                        <button
                          onClick={() => handleApproveStore(store.id)}
                          className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-all uppercase"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Phê Duyệt Hồ Sơ
                        </button>
                        <button
                          onClick={() => handleRejectStore(store.id)}
                          className="py-2.5 px-4 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 font-semibold rounded-xl text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-all uppercase border border-rose-200 dark:border-rose-900/30"
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
            <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-5 shadow-xs">
              
              {/* Search and filter controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên nhà vườn, email, chủ vườn..."
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="relative w-full sm:w-48">
                  <Filter className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  <select
                    value={storeCityFilter}
                    onChange={(e) => setStoreCityFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                  >
                    <option value="">Tất cả tỉnh thành</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Lâm Đồng">Lâm Đồng</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto text-xs rounded-xl border border-stone-200 dark:border-stone-850">
                <table className="w-full text-left text-stone-650 dark:text-stone-300 border-collapse">
                  <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase font-mono text-[9px]">
                    <tr>
                      <th className="p-4.5">Tên Nhà Vườn</th>
                      <th className="p-4.5">Đại Diện Pháp Nhân</th>
                      <th className="p-4.5">Khu Vực TP</th>
                      <th className="p-4.5 text-center">Carbon Offset</th>
                      <th className="p-4.5 text-center">Mặt hàng</th>
                      <th className="p-4.5 text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
                    {filteredApprovedStores.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-stone-400">Không tìm thấy nhà vườn nào khớp điều kiện tìm kiếm.</td>
                      </tr>
                    ) : (
                      filteredApprovedStores.map((store) => (
                        <tr key={store.id} className="hover:bg-stone-100/50 dark:hover:bg-stone-900/40 transition-colors">
                          <td className="p-4.5">
                            <div className="flex items-center gap-2.5">
                              <img src={store.avatar || "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=100"} alt={store.name} className="w-7 h-7 object-cover rounded-md" />
                              <div>
                                <span className="font-semibold text-stone-900 dark:text-stone-100 block">{store.name}</span>
                                <span className="text-[9px] text-stone-450 dark:text-stone-500 font-mono block">ID: {store.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4.5">
                            <div className="space-y-0.5">
                              <span className="block">{store.ownerName}</span>
                              <span className="text-[10px] text-stone-400 font-mono block">{store.ownerEmail}</span>
                            </div>
                          </td>
                          <td className="p-4.5 font-mono">{store.city}</td>
                          <td className="p-4.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-450">
                            {store.carbonOffsetKg} kg
                          </td>
                          <td className="p-4.5 text-center font-mono">{store.productsCount} món</td>
                          <td className="p-4.5 text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[8px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono font-bold uppercase border border-emerald-250 dark:border-emerald-900/30">
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
        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-5 shadow-xs animate-slide-down">
          
          {/* Header & filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase">
                Quản Lý Thành Viên Cổng Hệ Thống
              </h3>
              <p className="text-[10px] text-stone-400">Giám sát tài khoản, hạn mức Carbon Credits tích lũy, đổi thưởng xanh và quyền phân vai điều hành.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm họ tên, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full sm:w-48 pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                >
                  <option value="">Tất cả chức vụ</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                  <option value="store">Chủ cửa hàng (Store)</option>
                  <option value="customer">Khách hàng (Customer)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto text-xs rounded-xl border border-stone-200 dark:border-stone-850">
            <table className="w-full text-left text-stone-650 dark:text-stone-300 border-collapse">
              <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-4.5">Tên thành viên</th>
                  <th className="p-4.5">Liên hệ</th>
                  <th className="p-4.5 text-center">Hạn Mức Tín chỉ</th>
                  <th className="p-4.5 text-center">Carbon Khử (Saved)</th>
                  <th className="p-4.5">Vai Trò</th>
                  <th className="p-4.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
                {filteredUsers.map((u, idx) => (
                  <tr key={idx} className="hover:bg-stone-100/50 dark:hover:bg-stone-900/40 transition-colors">
                    <td className="p-4.5 font-semibold text-stone-900 dark:text-stone-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold font-display border border-emerald-500/20">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <span className="block">{u.name}</span>
                          <span className={`text-[8px] font-mono font-bold uppercase ${u.status === "Active" ? "text-emerald-500" : "text-rose-500"}`}>
                            ● {u.status}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4.5 font-mono">
                      <div className="space-y-0.5 text-[10px]">
                        <span className="block text-stone-450 dark:text-stone-400">{u.email}</span>
                        <span className="block text-stone-400">{u.phone}</span>
                      </div>
                    </td>
                    <td className="p-4.5 text-center font-mono font-bold text-stone-900 dark:text-stone-200">
                      {u.credits.toLocaleString("vi-VN")} CPT
                    </td>
                    <td className="p-4.5 text-center font-mono font-bold text-emerald-500">
                      -{u.carbonSaved} kg CO2
                    </td>
                    <td className="p-4.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider font-mono uppercase ${
                        u.role === "admin" 
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border border-rose-250 dark:border-rose-900/30" 
                          : u.role === "store" 
                            ? "bg-amber-100 dark:bg-amber-955 text-amber-800 dark:text-amber-400 border border-amber-250 dark:border-amber-900/30" 
                            : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4.5 text-right">
                      <button 
                        onClick={() => setSelectedUser(u)}
                        className="py-1 px-2.5 bg-stone-200 dark:bg-stone-900 hover:bg-stone-300 dark:hover:bg-stone-800 text-stone-750 dark:text-stone-300 font-semibold rounded-lg text-[10px] cursor-pointer transition-all flex items-center gap-1 ml-auto border border-stone-250 dark:border-stone-800"
                      >
                        <Eye className="h-3 w-3" /> Xem hồ sơ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PRODUCT MANAGEMENT TAB */}
      {activeTab === "products" && (
        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-5 shadow-xs animate-slide-down">
          
          {/* Header row & Add product */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase">
                Danh Mục Mặt Hàng Niêm Yết Sàn
              </h3>
              <p className="text-[10px] text-stone-400">Giám sát lượng hàng, định giá chênh lệch, chấm điểm EcoScore cho bao bì và nguồn gốc sản phẩm.</p>
            </div>
            
            <button
              onClick={() => setShowAddProductModal(true)}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-500/10 uppercase self-start lg:self-auto"
            >
              <Plus className="h-4 w-4" />
              Thêm Sản Phẩm Sinh Thái
            </button>
          </div>

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm tên sản phẩm, công dụng..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                >
                  <option value="">Mọi danh mục</option>
                  <option value="plants">Cây Cảnh (plants)</option>
                  <option value="nutrients">Dinh Dưỡng (nutrients)</option>
                  <option value="care">Chăm Sóc (care)</option>
                  <option value="smarthome">Eco-IoT SmartHome</option>
                </select>
              </div>
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <select
                  value={productStockFilter}
                  onChange={(e) => setProductStockFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                >
                  <option value="">Lượng kho</option>
                  <option value="out">Đã hết hàng</option>
                  <option value="low">Sắp hết hàng (&lt; 15)</option>
                  <option value="good">Lượng kho dồi dào (&gt;= 15)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto text-xs rounded-xl border border-stone-200 dark:border-stone-850">
            <table className="w-full text-left text-stone-650 dark:text-stone-300 border-collapse">
              <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-4.5">Sản Phẩm</th>
                  <th className="p-4.5">Danh Mục</th>
                  <th className="p-4.5 text-center">Định Giá VND</th>
                  <th className="p-4.5 text-center">Chỉ Số EcoScore</th>
                  <th className="p-4.5 text-center">Trạng Thái Kho</th>
                  <th className="p-4.5 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400">Không tìm thấy sản phẩm nào phù hợp bộ lọc.</td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isOutOfStock = p.stock === 0;
                    const isLowStock = p.stock > 0 && p.stock < 15;
                    return (
                      <tr key={p.id} className="hover:bg-stone-100/50 dark:hover:bg-stone-900/40 transition-colors">
                        <td className="p-4.5">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="w-9 h-9 object-cover rounded-lg border border-stone-200 dark:border-stone-800" />
                            <div className="space-y-0.5">
                              <span className="font-semibold text-stone-900 dark:text-stone-100 block">{p.name}</span>
                              <span className="text-[10px] text-stone-400 block">⭐ {p.rating} | Đánh giá tốt</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[8px] bg-stone-100 dark:bg-stone-900 text-stone-450 dark:text-stone-400 font-mono uppercase border border-stone-200 dark:border-stone-800">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-4.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-450">
                          {p.price.toLocaleString("vi-VN")}₫
                        </td>
                        <td className="p-4.5 text-center font-mono">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold text-stone-900 dark:text-emerald-400">{p.ecoScore}/100</span>
                            <div className="w-12 h-1.5 rounded-full bg-stone-200 dark:bg-stone-900 overflow-hidden hidden sm:block">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.ecoScore}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4.5 text-center font-mono">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            isOutOfStock 
                              ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-250 dark:border-rose-900/30" 
                              : isLowStock
                                ? "bg-amber-105 dark:bg-amber-955/40 text-amber-700 dark:text-amber-400 border border-amber-250 dark:border-amber-900/30"
                                : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30"
                          }`}>
                            {isOutOfStock ? "Hết Hàng" : isLowStock ? `Hạn Chế (${p.stock})` : `Đủ hàng (${p.stock})`}
                          </span>
                        </td>
                        <td className="p-4.5 text-right">
                          <button 
                            onClick={async () => {
                              if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${p.name}"?`)) {
                                try {
                                  console.log("Đang tiến hành gọi hàm xóa sản phẩm:", p.id);
                                  if (typeof deleteProduct !== "function") {
                                    throw new Error("Hàm deleteProduct chưa được Vite đóng gói lại (Context Cache). Bạn hãy tắt và khởi động lại npm run dev ở Frontend.");
                                  }
                                  const success = await deleteProduct(p.id);
                                  if (success) {
                                    alert("Đã xóa sản phẩm thành công!");
                                  } else {
                                    alert("Lỗi khi xóa sản phẩm từ máy chủ.");
                                  }
                                } catch (err: any) {
                                  console.error("Lỗi click xóa:", err);
                                  alert(`Không thể thực hiện xóa: ${err.message || err}`);
                                }
                              }
                            }}
                            className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-5 shadow-xs animate-slide-down">
          
          {/* Header row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase">
                Quản Lý Các Giao Dịch Đơn Hàng Sàn
              </h3>
              <p className="text-[10px] text-stone-400">Xem hóa đơn thanh khoản, cập nhật lộ trình giao vận, và tính toán hệ số carbon giảm thiểu gián tiếp.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Mã đơn, tên khách hàng..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="w-full sm:w-48 pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Chờ xử lý (pending)</option>
                  <option value="processing">Đang đóng gói (processing)</option>
                  <option value="shipped">Đang giao vận (shipped)</option>
                  <option value="completed">Đã giao thành công</option>
                  <option value="cancelled">Đã hủy đơn</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto text-xs rounded-xl border border-stone-200 dark:border-stone-850">
            <table className="w-full text-left text-stone-650 dark:text-stone-300 border-collapse">
              <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase font-mono text-[9px]">
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
              <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">Không tìm thấy mã đơn hàng phù hợp bộ lọc.</td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-100/50 dark:hover:bg-stone-900/40 transition-colors">
                      <td className="p-4.5 font-mono font-bold text-stone-900 dark:text-stone-100">{o.id}</td>
                      <td className="p-4.5">{o.customerName}</td>
                      <td className="p-4.5 font-mono text-stone-500">{o.date}</td>
                      <td className="p-4.5 text-center font-mono">{o.itemsCount} sản phẩm</td>
                      <td className="p-4.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-450">
                        {o.total.toLocaleString("vi-VN")}₫
                      </td>
                      <td className="p-4.5 text-center font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getOrderStatusColor(o.status)}`}>
                          {getOrderStatusLabel(o.status)}
                        </span>
                      </td>
                      <td className="p-4.5 text-right">
                        <button 
                          onClick={() => setSelectedOrder(o)}
                          className="py-1 px-2.5 bg-stone-200 dark:bg-stone-900 hover:bg-stone-300 dark:hover:bg-stone-800 text-stone-750 dark:text-stone-300 font-semibold rounded-lg text-[10px] cursor-pointer transition-all flex items-center gap-1 ml-auto border border-stone-250 dark:border-stone-800"
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

      {/* 6. BOOKING MANAGEMENT TAB */}
      {activeTab === "bookings" && (
        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-5 shadow-xs animate-slide-down">
          
          {/* Header row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase">
                Lịch Tư Vấn Khoa Học Nông Nghiệp
              </h3>
              <p className="text-[10px] text-stone-400">Giám sát các ca tư vấn chuyên sâu của PGS TS Sinh học với cư dân đô thị, cập nhật trạng thái lịch hẹn.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm chuyên gia, chủ đề tư vấn..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="w-full sm:w-48 pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                >
                  <option value="">Mọi trạng thái</option>
                  <option value="pending">Chờ xác nhận (pending)</option>
                  <option value="confirmed">Đã duyệt (confirmed)</option>
                  <option value="completed">Đã hoàn tất (completed)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto text-xs rounded-xl border border-stone-200 dark:border-stone-850">
            <table className="w-full text-left text-stone-650 dark:text-stone-300 border-collapse">
              <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-4.5">Chuyên Gia Cố Vấn</th>
                  <th className="p-4.5">Chuyên Đề Tư Vấn</th>
                  <th className="p-4.5 font-mono">Thời Gian Slot</th>
                  <th className="p-4.5 text-center font-mono">Chi phí tư vấn</th>
                  <th className="p-4.5 text-center">Hình Thức</th>
                  <th className="p-4.5 text-center">Trạng Thái</th>
                  <th className="p-4.5 text-right">Điều Hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">Không tìm thấy ca tư vấn nào phù hợp.</td>
                  </tr>
                ) : (
                  filteredAppointments.map((a) => (
                    <tr key={a.id} className="hover:bg-stone-100/50 dark:hover:bg-stone-900/40 transition-colors">
                      <td className="p-4.5">
                        <div className="flex items-center gap-2.5">
                          <img src={a.expertAvatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"} alt={a.expertName} className="w-7.5 h-7.5 object-cover rounded-full border border-stone-200 dark:border-stone-800" />
                          <span className="font-semibold text-stone-900 dark:text-stone-100">{a.expertName}</span>
                        </div>
                      </td>
                      <td className="p-4.5">
                        <div className="max-w-xs space-y-0.5">
                          <span className="block truncate text-stone-750 dark:text-stone-200 font-semibold">{a.title}</span>
                          {a.userNotes && <span className="block text-[10px] text-stone-400 truncate">Ghi chú: {a.userNotes}</span>}
                        </div>
                      </td>
                      <td className="p-4.5 font-mono text-stone-500">
                        <div className="space-y-0.5">
                          <span className="block">{a.date}</span>
                          <span className="block font-bold text-stone-700 dark:text-stone-300">{a.time} ({a.durationMinutes || 60}m)</span>
                        </div>
                      </td>
                      <td className="p-4.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-450">
                        {a.price.toLocaleString("vi-VN")}₫
                      </td>
                      <td className="p-4.5 text-center font-mono uppercase text-[9px]">
                        <span className={`px-2 py-0.5 rounded font-bold ${a.type === "online" ? "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400" : "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400"}`}>
                          {a.type}
                        </span>
                      </td>
                      <td className="p-4.5 text-center font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          a.status === "completed" 
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-250"
                            : a.status === "confirmed"
                              ? "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-250"
                              : "bg-amber-100 dark:bg-amber-955/40 text-amber-700 dark:text-amber-400 border border-amber-250"
                        }`}>
                          {a.status === "completed" ? "Đã Xong" : a.status === "confirmed" ? "Đã Duyệt" : "Chờ duyệt"}
                        </span>
                      </td>
                      <td className="p-4.5 text-right">
                        {a.status === "pending" && (
                          <button 
                            onClick={() => handleUpdateBookingStatus(a.id, "confirmed")}
                            className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-[9px] cursor-pointer transition-all uppercase border border-emerald-400"
                          >
                            Xác Nhận
                          </button>
                        )}
                        {a.status === "confirmed" && (
                          <button 
                            onClick={() => handleUpdateBookingStatus(a.id, "completed")}
                            className="py-1 px-2.5 bg-stone-200 dark:bg-stone-900 hover:bg-stone-300 dark:hover:bg-stone-800 text-stone-750 dark:text-stone-300 font-semibold rounded-lg text-[9px] cursor-pointer transition-all uppercase border border-stone-250 dark:border-stone-800"
                          >
                            Hoàn Thành
                          </button>
                        )}
                        {a.status === "completed" && (
                          <span className="text-[10px] text-stone-400 italic">Lịch sử</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== MODALS & POPUPS SYSTEM ==================== */}

      {/* 1. Add Product Eco Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-stone-950 border border-stone-850 w-full max-w-2xl rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative my-8 animate-slide-down">
            
            <button 
              onClick={() => setShowAddProductModal(false)}
              className="absolute right-4.5 top-4.5 p-2 rounded-full bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-emerald-500 font-bold uppercase tracking-widest block">LAUNCH ECOLOGICAL PRODUCT</span>
              <h3 className="text-xl md:text-2xl font-display font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sprout className="h-6 w-6 text-emerald-500" />
                Thêm Sản Phẩm Sinh Thái Mới
              </h3>
              <p className="text-[11px] text-stone-400">Khởi tạo mã sản phẩm xanh mới lên sàn giao dịch nông nghiệp sinh học GreenLife.</p>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Tên sản phẩm sinh thái *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đất nung Bát Tràng tơi xốp"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Nhóm danh mục *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                  >
                    <option value="plants">Cây Xanh Bản Địa (plants)</option>
                    <option value="nutrients">Chất Dinh Dưỡng Hữu Cơ (nutrients)</option>
                    <option value="care">Chăm Sóc & Sinh Học (care)</option>
                    <option value="smarthome">Hệ Thống Smart-IoT (smarthome)</option>
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Đơn giá bán niêm yết (VND) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 150000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Stock */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Số lượng nhập kho ban đầu *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 50"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* EcoScore */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Chỉ số thân thiện EcoScore (1-100) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    placeholder="Ví dụ: 95"
                    value={newProduct.ecoScore}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, ecoScore: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-1">
                  <label className="text-stone-400 block font-semibold">Đường dẫn hình ảnh minh họa (URL)</label>
                  <input
                    type="text"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 focus:outline-none focus:border-emerald-500 font-mono text-[10px]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-stone-400 block font-semibold">Mô tả đặc tính sinh thái sản phẩm</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả các tiêu chí đạt organic, khả năng tự phân hủy của bao bì vỏ ngoài..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="flex gap-4.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 font-bold rounded-xl cursor-pointer transition-colors border border-stone-800 uppercase"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-emerald-500/10 uppercase border border-emerald-400"
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
          <div className="bg-stone-950 border border-stone-850 w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-slide-down">
            
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl font-bold font-display shadow-inner">
                {selectedUser.name.charAt(0)}
              </div>
              
              <div className="space-y-1">
                <h3 className="font-display font-bold text-stone-900 dark:text-stone-100 text-lg leading-tight">{selectedUser.name}</h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-900 uppercase">
                  {selectedUser.role}
                </span>
              </div>

              {/* Bio block */}
              <p className="text-[11px] text-stone-400 leading-relaxed max-w-xs italic">
                &ldquo;Thành viên tích cực tham gia cổng trao đổi nông sinh học và tích trữ chỉ số carbon danh dự.&rdquo;
              </p>

              {/* Metrics scoring board */}
              <div className="grid grid-cols-2 gap-4 w-full bg-stone-900/60 p-4 rounded-2xl border border-stone-850 text-left font-mono">
                <div>
                  <span className="text-[9px] text-stone-500 uppercase block">Ví Tín Chỉ Carbon</span>
                  <span className="text-sm font-bold text-stone-100 block mt-0.5 flex items-center gap-1">
                    <Coins className="h-4 w-4 text-amber-500" />
                    {selectedUser.credits.toLocaleString()} CPT
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-stone-500 uppercase block">Carbon Đã Khử</span>
                  <span className="text-sm font-bold text-emerald-400 block mt-0.5 flex items-center gap-1">
                    <Leaf className="h-4 w-4" />
                    -{selectedUser.carbonSaved} kg CO2
                  </span>
                </div>
                <div className="col-span-2 border-t border-stone-850/50 pt-2 mt-1">
                  <span className="text-[9px] text-stone-500 uppercase block">Mã định danh liên kết</span>
                  <span className="text-[10px] text-stone-300 block mt-0.5 font-mono truncate">{selectedUser.email}</span>
                  <span className="text-[10px] text-stone-300 block font-mono">SDT: {selectedUser.phone}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full pt-2">
                <button
                  onClick={async () => {
                    const success = await awardUserCredits(selectedUser.id, 500);
                    if (success) {
                      alert("Tặng thành công 500 CPT Carbon Credits cho thành viên!");
                    } else {
                      alert("Có lỗi xảy ra khi tặng Carbon Credits.");
                    }
                    setSelectedUser(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-[10px] uppercase font-mono tracking-wider transition-all cursor-pointer"
                >
                  Tặng Carbon Credits
                </button>
                <button
                  onClick={async () => {
                    const success = await toggleUserStatus(selectedUser.id);
                    if (success) {
                      const nextStatus = selectedUser.status === "Active" ? "Bị Khóa" : "Kích Hoạt";
                      alert(`Đã cập nhật trạng thái tài khoản thành viên thành công: ${nextStatus}`);
                    } else {
                      alert("Có lỗi xảy ra khi thay đổi trạng thái tài khoản.");
                    }
                    setSelectedUser(null);
                  }}
                  className="py-2.5 px-4 bg-rose-955/20 text-rose-500 hover:bg-rose-955/40 font-semibold rounded-xl text-[10px] uppercase font-mono tracking-wider transition-all border border-rose-900/30 cursor-pointer"
                >
                  {selectedUser.status === "Active" ? "Khóa acc" : "Kích hoạt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Detailed Order Invoice Drawer Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-stone-950 border border-stone-850 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative animate-slide-down">
            
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4.5 top-4.5 p-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="space-y-1 pb-4 border-b border-stone-850">
              <span className="text-[8px] font-mono text-emerald-500 font-bold uppercase tracking-widest">TRANSACTION INVOICE AUDIT</span>
              <h3 className="text-base font-display font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                Hóa Đơn Chi Tiết: {selectedOrder.id}
              </h3>
              <p className="text-[10px] text-stone-400 font-mono">Khách hàng: {selectedOrder.customerName} | Ngày đặt: {selectedOrder.date}</p>
            </div>

            {/* List of items purchased */}
            <div className="my-5 space-y-3.5 max-h-52 overflow-y-auto pr-1">
              <span className="text-[9px] text-stone-500 font-mono uppercase block tracking-wider">Danh mục giỏ hàng thanh khoản</span>
              
              {getOrderItems(selectedOrder.id).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center gap-4 bg-stone-900/40 p-2.5 rounded-xl border border-stone-850 text-xs">
                  <div className="flex items-center gap-2.5">
                    <img src={item.img} alt={item.name} className="w-8 h-8 object-cover rounded-md" />
                    <div>
                      <span className="font-semibold text-stone-200 block max-w-xs truncate">{item.name}</span>
                      <span className="text-[10px] text-stone-500 font-mono block">Số lượng: x{item.qty}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-stone-100">
                    {(item.price * item.qty).toLocaleString("vi-VN")}₫
                  </span>
                </div>
              ))}
            </div>

            {/* Cost breakdown metrics & CO2 offset weight */}
            <div className="bg-stone-900/80 p-4 rounded-2xl border border-stone-850 space-y-2 text-[11px] font-mono">
              <div className="flex justify-between text-stone-400">
                <span>Giá trị giỏ hàng:</span>
                <span>{(selectedOrder.total - 30000).toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Bao bì phân hủy & Ship:</span>
                <span>30,000₫</span>
              </div>
              <div className="border-t border-stone-850/50 pt-2 flex justify-between font-bold text-stone-100">
                <span>Tổng chi trả thực:</span>
                <span className="text-emerald-450">{selectedOrder.total.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl flex items-center justify-between text-[10px] text-emerald-400 mt-2">
                <span className="flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5 animate-pulse" /> Giảm CO2 tương đương:</span>
                <span className="font-bold">-{selectedOrder.itemsCount * 12} kg CO2</span>
              </div>
            </div>

            {/* Action Area: Update transaction routing path */}
            <div className="mt-6 pt-4 border-t border-stone-850 flex flex-col gap-3">
              <span className="text-[9px] text-stone-500 font-mono uppercase block">Điều chỉnh lộ trình giao vận</span>
              
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
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, st.key)}
                      className={`py-1.5 px-3 rounded-lg text-[9px] font-mono uppercase tracking-wider font-semibold cursor-pointer transition-all ${
                        isCurrent 
                          ? "bg-emerald-500 text-black font-bold border border-emerald-400" 
                          : "bg-stone-900 hover:bg-stone-850 text-stone-400 border border-stone-850"
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

    </div>
  );
};
