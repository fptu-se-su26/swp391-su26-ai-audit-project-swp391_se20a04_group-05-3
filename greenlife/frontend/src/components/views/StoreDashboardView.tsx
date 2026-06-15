import React, { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { 
  Landmark, 
  ShoppingBag, 
  Sprout, 
  TrendingUp, 
  Inbox, 
  ShieldAlert, 
  PlusCircle, 
  MapPin, 
  Save, 
  Settings, 
  Check, 
  Clock, 
  Truck, 
  Pencil, 
  Trash2, 
  FileText,
  Activity,
  Award,
  Sparkles,
  SlidersHorizontal,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { StoreOrder, Product } from "../../types";
import { INITIAL_ORDERS } from "../../data";
import { useAppContext } from "../../context/AppContext";

interface StoreDashboardViewProps {
  products: Product[];
  onAddProduct: (p: Product) => void;
}

export const StoreDashboardView: React.FC<StoreDashboardViewProps> = ({
  products,
  onAddProduct,
}) => {
  const { stores, updateStoreInfo, currentUser, storeActiveTab, setStoreActiveTab } = useAppContext();

  // Active tab state connected directly to global context
  const activeTab = storeActiveTab;
  const setActiveTab = setStoreActiveTab;

  // Local state for orders to simulate live status updates in the portal
  const [localOrders, setLocalOrders] = useState<StoreOrder[]>(INITIAL_ORDERS);

  // Form states for listing new product
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState(150000);
  const [productCategory, setProductCategory] = useState<"plants" | "care" | "nutrients" | "smarthome">("plants");
  const [productStock, setProductStock] = useState(50);
  const [productDescription, setProductDescription] = useState("");
  const [productSuccess, setProductSuccess] = useState(false);

  // Search & Filter States
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");

  // Identify the specific store belonging to this store owner
  const myStore = useMemo(() => {
    return stores.find((s) => s.ownerEmail === currentUser?.email) || stores[0] || {
      id: "store-3",
      name: "Nhà Vườn Thảo Mộc Đô Thị GreenLife",
      ownerName: currentUser?.name || "Đối tác Nhà Vườn",
      ownerEmail: currentUser?.email || "nursery.partner@greenlife.vn",
      rating: 5.0,
      avatar: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=150",
      bannerImage: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1000",
      address: "120 Hoàng Diệu, Hải Châu, Đà Nẵng, Việt Nam",
      workingHours: "08:00 - 18:00 (Hằng ngày)",
      carbonOffsetKg: 705,
      productsCount: 15,
      verified: true,
      city: "Đà Nẵng",
      district: "Hải Châu",
      serviceArea: "Hải Châu, Đà Nẵng"
    };
  }, [stores, currentUser]);

  // Form states for Store settings
  const [storeName, setStoreName] = useState(myStore?.name || "");
  const [storeCity, setStoreCity] = useState(myStore?.city || "Đà Nẵng");
  const [storeDistrict, setStoreDistrict] = useState(myStore?.district || "");
  const [storeAddress, setStoreAddress] = useState(myStore?.address || "");
  const [storeServiceArea, setStoreServiceArea] = useState(myStore?.serviceArea || "Bán kính 10km");
  const [storeLat, setStoreLat] = useState(myStore?.latitude || 16.0);
  const [storeLng, setStoreLng] = useState(myStore?.longitude || 108.0);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Sync form states when myStore changes
  React.useEffect(() => {
    if (myStore) {
      setStoreName(myStore.name);
      setStoreCity(myStore.city || "Đà Nẵng");
      setStoreDistrict(myStore.district || "");
      setStoreAddress(myStore.address);
      setStoreServiceArea(myStore.serviceArea || "Bán kính 10km");
      setStoreLat(myStore.latitude || 16.0);
      setStoreLng(myStore.longitude || 108.0);
    }
  }, [myStore]);

  const handleStoreSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myStore) return;

    updateStoreInfo(myStore.id, {
      name: storeName,
      city: storeCity,
      district: storeDistrict,
      address: storeAddress,
      serviceArea: storeServiceArea,
      latitude: Number(storeLat),
      longitude: Number(storeLng)
    });

    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  const handleAddNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: productName,
      category: productCategory,
      price: productPrice,
      rating: 5.0,
      image: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80",
      description: productDescription || "Sản phẩm do nhà vườn đối tác chịu trách nhiệm gieo cấy sinh học, đã thông qua giám định hàm lượng carbon.",
      ecoScore: 92,
      details: ["Nguồn tự nhiên gieo trồng bản địa", "Bao bì hữu cơ tự hoại màng gạo"],
      specs: {
        "Nguồn gốc": myStore?.name || "Nhà Vườn Thảo Mộc Đô Thị GreenLife",
        "Dấu chân carbon": "-18kg CO2eq"
      },
      stock: productStock
    };

    onAddProduct(newProd);
    setProductName("");
    setProductPrice(150000);
    setProductStock(50);
    setProductDescription("");
    setProductSuccess(true);
    setTimeout(() => setProductSuccess(false), 4000);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: "processing" | "shipped" | "completed") => {
    setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    alert(`Đã cập nhật trạng thái đơn hàng ${orderId} sang: ${
      newStatus === "processing" ? "Đang Gói Hàng" : newStatus === "shipped" ? "Đang Giao Hàng" : "Đã Hoàn Tất"
    }`);
  };

  // Recharts Sales performance weekly dataset
  const chartData = [
    { name: "Thứ 2", DoanhThuVnd: 1200000, CarbonOffsetKg: 45 },
    { name: "Thứ 3", DoanhThuVnd: 1850000, CarbonOffsetKg: 60 },
    { name: "Thứ 4", DoanhThuVnd: 2400000, CarbonOffsetKg: 85 },
    { name: "Thứ 5", DoanhThuVnd: 1500000, CarbonOffsetKg: 50 },
    { name: "Thứ 6", DoanhThuVnd: 3800000, CarbonOffsetKg: 120 },
    { name: "Thứ 7", DoanhThuVnd: 4200000, CarbonOffsetKg: 150 },
    { name: "Chủ Nhật", DoanhThuVnd: 5120000, CarbonOffsetKg: 195 }
  ];

  // Filtering products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.description.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === "" || p.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter products owned by this store specifically
  const myProducts = filteredProducts.filter((p) => p.specs && p.specs["Nguồn gốc"] === myStore?.name);
  const otherProducts = filteredProducts.filter((p) => !p.specs || p.specs["Nguồn gốc"] !== myStore?.name);

  // Filtering orders
  const filteredOrders = localOrders.filter((o) => {
    const matchesSearch = o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) || 
                          o.id.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === "" || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case "processing": return "Đang đóng gói";
      case "shipped": return "Đang vận chuyển";
      case "completed": return "Đã hoàn thành";
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
            <span className="text-xs text-emerald-600 dark:text-emerald-500 font-mono tracking-widest uppercase font-semibold">GREENPARTNER ROOT PORTAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2.5">
            <Landmark className="h-9 w-9 text-emerald-650 dark:text-emerald-450 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            Kênh Quản Lý Nhà Vườn GreenPartner
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm max-w-xl leading-relaxed">
            Hệ thống điều hành đối tác nhà vườn. Giám sát doanh số tuần, quản lý đóng gói đơn hàng organic bền vững và niêm yết thêm các mầm xanh đạt chuẩn Eco-Score lên sàn.
          </p>
        </div>

        {/* Real-time server connection stats */}
        <div className="flex flex-wrap md:flex-col lg:flex-row items-start lg:items-center gap-3.5 bg-stone-900/5 dark:bg-stone-950/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-850 font-mono text-[10px] text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span>Đối Tác: <strong className="text-emerald-500 dark:text-emerald-400">LCA Verified</strong></span>
          </div>
          <span className="hidden lg:inline text-stone-300 dark:text-stone-800">|</span>
          <div className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-emerald-500" />
            <span>Hạng Vườn: <strong className="text-emerald-500 dark:text-emerald-400">Lá Phổi Xanh</strong></span>
          </div>
          <span className="hidden lg:inline text-stone-300 dark:text-stone-800">|</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>Đóng gói: <strong className="text-emerald-500 dark:text-emerald-400">Bio-Bag 100%</strong></span>
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE TAB VIEW */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-slide-down">
          {/* Metrics score row */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { 
                title: "20,070,000₫", 
                desc: "Tổng Doanh Thu Tuần", 
                icon: Landmark, 
                sub: "+15.2% so với tháng trước",
                color: "from-teal-500/10 to-emerald-500/5",
                badge: "Revenue Flow"
              },
              { 
                title: `${myStore?.carbonOffsetKg || 705} kg CO₂`, 
                desc: "Carbon Đã Tích Lũy Bù Đắp", 
                icon: Sprout, 
                sub: "Được quy đổi thăng hạng chứng chỉ",
                color: "from-emerald-500/10 to-lime-500/5",
                badge: "CO2 Offset",
                trend: "+12.4%"
              },
              { 
                title: `${myProducts.length || 3} Dòng Cây`, 
                desc: "Sản Phẩm Niêm Yết Của Vườn", 
                icon: ShoppingBag, 
                sub: "100% đạt chuẩn Eco-Score > 85%",
                color: "from-green-500/10 to-teal-500/5",
                badge: "Bio-Catalog"
              }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="group bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
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
                  </div>
                </div>
              );
            })}
          </section>

          {/* Recharts Chart Block */}
          <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase flex items-center gap-1.5">
                  <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
                  Hiệu Suất Vận Hành & Khử Carbon Tích Lũy Theo Tuần
                </h3>
                <p className="text-[10px] text-stone-400 font-mono">Dữ liệu phân tích dòng tiền và lượng CO2 đã trung hòa qua bao bì Bio-Bag</p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#88888812" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#666" fontSize={11} axisLine={false} tickLine={false} />
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
                  <Area type="monotone" dataKey="DoanhThuVnd" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} name="Doanh Thu (VND)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. ORDERS MANAGEMENT TAB */}
      {activeTab === "orders" && (
        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-5 shadow-xs animate-slide-down">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase">
                Quản Lý Đơn Mua Hàng Hữu Cơ
              </h3>
              <p className="text-[10px] text-stone-400">Tiếp nhận thông tin khách mua, thực hiện đóng gói bằng bao bì tinh bột tự phân hủy và điều phối vận chuyển.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm mã đơn, khách hàng..."
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
                  <option value="processing">Đang đóng gói</option>
                  <option value="shipped">Đang vận chuyển</option>
                  <option value="completed">Đã hoàn thành</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto text-xs rounded-xl border border-stone-200 dark:border-stone-850">
            <table className="w-full text-left text-stone-650 dark:text-stone-300 border-collapse">
              <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-880 text-stone-500 uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-4.5">Mã Đơn</th>
                  <th className="p-4.5">Khách Hàng</th>
                  <th className="p-4.5">Ngày Mua</th>
                  <th className="p-4.5 text-center">Số Món</th>
                  <th className="p-4.5 text-center">Tổng Giá Trị</th>
                  <th className="p-4.5">Trạng Thái</th>
                  <th className="p-4.5 text-right">Điều Phối Hoạt Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">Không tìm thấy đơn hàng nào khớp điều kiện tìm kiếm.</td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-100/50 dark:hover:bg-stone-900/40 transition-colors">
                      <td className="p-4.5 font-mono font-bold text-stone-900 dark:text-stone-100">{ord.id}</td>
                      <td className="p-4.5">{ord.customerName}</td>
                      <td className="p-4.5 font-mono">{ord.date}</td>
                      <td className="p-4.5 text-center font-mono">{ord.itemsCount}</td>
                      <td className="p-4.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {ord.total.toLocaleString("vi-VN")}₫
                      </td>
                      <td className="p-4.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${getOrderStatusColor(ord.status)}`}>
                          {getOrderStatusLabel(ord.status)}
                        </span>
                      </td>
                      <td className="p-4.5 text-right">
                        <div className="flex gap-1.5 justify-end">
                          {ord.status === "processing" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, "shipped")}
                              className="px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-black font-semibold rounded-lg text-[9px] flex items-center gap-1 cursor-pointer transition-all uppercase"
                              title="Chuyển sang vận chuyển"
                            >
                              <Truck className="h-3 w-3" /> Giao Hàng
                            </button>
                          )}
                          {ord.status === "shipped" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, "completed")}
                              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-[9px] flex items-center gap-1 cursor-pointer transition-all uppercase"
                              title="Hoàn tất đơn hàng"
                            >
                              <Check className="h-3 w-3" /> Hoàn Tất
                            </button>
                          )}
                          {ord.status === "completed" && (
                            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono italic">Đã giao thành công</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PRODUCTS CATALOG & LISTING TAB */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-slide-down">
          {/* Table of active products */}
          <div className="lg:col-span-8 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase">
                  Danh Mục Sản Phẩm Của Nhà Vườn
                </h3>
                <p className="text-[10px] text-stone-400">Danh sách các dòng cây, chế phẩm sinh học được phân phối từ vườn của bạn.</p>
              </div>
              
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên cây..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-850 dark:text-stone-100 focus:outline-none focus:border-emerald-500 font-mono w-40"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto text-xs rounded-xl border border-stone-200 dark:border-stone-850">
              <table className="w-full text-left text-stone-650 dark:text-stone-300 border-collapse">
                <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase font-mono text-[9px]">
                  <tr>
                    <th className="p-3">Sản phẩm</th>
                    <th className="p-3">Danh Mục</th>
                    <th className="p-3 text-center">Đơn giá</th>
                    <th className="p-3 text-center">Tồn kho</th>
                    <th className="p-3 text-center">Eco-Score</th>
                    <th className="p-3 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
                  {myProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400">Chưa có sản phẩm nào do vườn của bạn đăng bán. Hãy sử dụng form bên cạnh để niêm yết!</td>
                    </tr>
                  ) : (
                    myProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-100/50 dark:hover:bg-stone-900/40 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <img src={p.image} alt={p.name} className="w-8 h-8 object-cover rounded-lg border border-stone-200 dark:border-stone-850" />
                            <div>
                              <span className="font-semibold text-stone-900 dark:text-stone-100 block line-clamp-1">{p.name}</span>
                              <span className="text-[9px] text-stone-400 font-mono block">ID: {p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 capitalize font-mono text-[10px]">{p.category === "plants" ? "Cây xanh" : p.category === "care" ? "Chăm sóc" : p.category === "nutrients" ? "Dinh dưỡng" : "IoT"}</td>
                        <td className="p-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">{p.price.toLocaleString("vi-VN")}₫</td>
                        <td className="p-3 text-center font-mono">{p.stock} món</td>
                        <td className="p-3 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/20 text-emerald-400 border border-emerald-900/10 font-bold font-mono text-[9px]">{p.ecoScore}%</span>
                        </td>
                        <td className="p-3 text-right text-stone-400">
                          <span className="inline-flex px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono text-[8px] uppercase font-bold">Đang Bán</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Other marketplace catalog block */}
            <div className="pt-4 border-t border-stone-250 dark:border-stone-850">
              <span className="text-[10px] text-stone-400 font-mono block uppercase mb-3">Xem các sản phẩm khác trên sàn GreenMarket:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {otherProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="p-2.5 bg-stone-100 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-850 rounded-xl space-y-1">
                    <img src={p.image} alt={p.name} className="w-full h-18 object-cover rounded-lg" />
                    <span className="font-semibold text-stone-900 dark:text-stone-100 block text-[10px] line-clamp-1 mt-1">{p.name}</span>
                    <div className="flex justify-between items-center text-[9px] font-mono mt-0.5">
                      <span className="text-emerald-500 font-bold">{p.price.toLocaleString("vi-VN")}₫</span>
                      <span className="text-stone-400">Tồn: {p.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Form to List New Product */}
          <div className="lg:col-span-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-xs">
            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase flex items-center gap-1.5">
              <PlusCircle className="h-4.5 w-4.5 text-emerald-500" />
              Niêm Yết Mầm Xanh Mới
            </h3>

            {productSuccess && (
              <div className="p-3 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Đăng sản phẩm thành công! Đã qua kiểm định LCA và đưa lên sàn GreenMarket.</span>
              </div>
            )}

            <form onSubmit={handleAddNewProductSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-stone-500 dark:text-stone-400 font-mono block font-semibold">Tên mặt hàng hữu cơ:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cây Trầu Bà Leo Cột hữu cơ"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-stone-500 dark:text-stone-400 font-mono block font-semibold">Đơn giá (VND):</label>
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(Number(e.target.value))}
                    className="w-full bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-500 dark:text-stone-400 font-mono block font-semibold">Số lượng tồn kho:</label>
                  <input
                    type="number"
                    value={productStock}
                    onChange={(e) => setProductStock(Number(e.target.value))}
                    className="w-full bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-stone-500 dark:text-stone-400 font-mono block font-semibold">Nhóm ngành sinh học:</label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value as any)}
                  className="w-full bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono cursor-pointer"
                >
                  <option value="plants">Cây Xanh (Plants)</option>
                  <option value="care">Chăm Sóc (Care)</option>
                  <option value="nutrients">Dinh Dưỡng (Nutrients)</option>
                  <option value="smarthome">Thiết Bị IoT (Smarthome)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-stone-500 dark:text-stone-400 font-mono block font-semibold">Mô tả sản phẩm:</label>
                <textarea
                  placeholder="Ghi nhận nguồn gốc gieo trồng bản địa và quy chuẩn bao bì tự hủy sinh học..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/10 rounded-xl text-[10px] text-stone-500 dark:text-stone-400 leading-normal">
                🌱 Tất cả sản phẩm tải lên bắt buộc phải cam kết quy cách gieo trồng sạch hữu cơ và đóng gói bằng túi sinh học bột mì/sơ dừa tự hủy.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs cursor-pointer transition-all uppercase tracking-wider"
              >
                Phê Duyệt Đưa Lên Sàn
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="max-w-3xl mx-auto bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xs animate-slide-down">
          <div>
            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase flex items-center gap-1.5">
              <Settings className="h-4.5 w-4.5 text-emerald-500" />
              Cấu Hình Địa Điểm & Định Vị Nhà Vườn
            </h3>
            <p className="text-[10px] text-stone-400 mt-1">Cấu hình tọa độ vệ tinh Lat/Lng và địa chỉ đăng ký kho hàng để phục vụ thuật toán tối ưu hóa quãng đường giao nhận hàng.</p>
          </div>

          {settingsSuccess && (
            <div className="p-3 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Cập nhật cấu hình định vị tọa độ của Nhà Vườn đối tác thành công!</span>
            </div>
          )}

          <form onSubmit={handleStoreSettingsSubmit} className="space-y-5 text-xs">
            <div className="space-y-1.5">
              <label className="text-stone-500 dark:text-stone-400 font-mono block font-semibold">Tên Nhà Vườn Đối Tác:</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-stone-500 dark:text-stone-400 font-mono block font-semibold">Thành phố:</label>
                <select
                  value={storeCity}
                  onChange={(e) => setStoreCity(e.target.value)}
                  className="w-full bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none font-mono cursor-pointer"
                >
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Lâm Đồng">Lâm Đồng</option>
                  <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-stone-500 dark:text-stone-400 font-mono block font-semibold">Quận / Huyện:</label>
                <input
                  type="text"
                  value={storeDistrict}
                  onChange={(e) => setStoreDistrict(e.target.value)}
                  className="w-full bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-500 dark:text-stone-400 font-mono block font-semibold">Địa chỉ kho bãi cụ thể:</label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-stone-500 dark:text-stone-400 font-mono block font-semibold">Phạm vi phục vụ (Service Area):</label>
                <input
                  type="text"
                  value={storeServiceArea}
                  onChange={(e) => setStoreServiceArea(e.target.value)}
                  className="w-full bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-stone-500 dark:text-stone-400 font-mono block font-semibold">Kinh độ (Lng):</label>
                  <input
                    type="number"
                    step="any"
                    value={storeLng}
                    onChange={(e) => setStoreLng(Number(e.target.value))}
                    className="w-full bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-2 text-xs focus:outline-none font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-stone-500 dark:text-stone-400 font-mono block font-semibold">Vĩ độ (Lat):</label>
                  <input
                    type="number"
                    step="any"
                    value={storeLat}
                    onChange={(e) => setStoreLat(Number(e.target.value))}
                    className="w-full bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-2 text-xs focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-stone-100 dark:bg-stone-900/50 p-4.5 rounded-2xl border border-stone-250 dark:border-stone-850 space-y-2">
              <span className="text-[10px] text-stone-400 font-mono block uppercase font-bold flex items-center gap-1 text-emerald-500">
                <MapPin className="w-3.5 h-3.5" /> Định Vị Mô Phỏng Vệ Tinh (Eco-GIS Simulator)
              </span>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Hệ tọa độ <strong className="text-stone-700 dark:text-stone-300">({storeLat}, {storeLng})</strong> đã được đối chiếu thành công khớp với vùng đệm sinh thái Hòa Lạc / Sơn Trà. Thuật toán của GreenLife sẽ tự động điều phối các đơn hàng trong bán kính phủ xanh để tối thiểu hóa phát thải Carbon của shipper.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 tracking-wider"
            >
              <Save className="h-4 w-4" />
              Cập Nhật Cấu Hình Đối Tác
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
