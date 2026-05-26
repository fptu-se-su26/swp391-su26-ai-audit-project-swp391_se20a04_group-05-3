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
  Trash2 
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { INITIAL_ORDERS } from "../data";

export const AdminDashboardView: React.FC = () => {
  const { 
    stores, 
    products, 
    appointments, 
    updateStoreInfo,
    setCurrentPage 
  } = useAppContext();

  // Tab state: "overview" | "stores" | "users" | "products" | "orders" | "bookings"
  const [activeTab, setActiveTab] = useState<"overview" | "stores" | "users" | "products" | "orders" | "bookings">("overview");

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

  // Mock users list
  const mockUsers = [
    { name: "Nguyễn Hoàng Long", email: "vip.customer@greenlife.vn", role: "Khách hàng", date: "2025-01-10" },
    { name: "Lê Minh Dương", email: "nursery.partner@greenlife.vn", role: "Chủ cửa hàng", date: "2024-06-15" },
    { name: "TS. Nguyễn Thành Trung", email: "ecology.root@greenlife.vn", role: "Quản trị viên", date: "2023-10-01" },
    { name: "Trần Xuân Sơn", email: "dalat.succulent@greenlife.vn", role: "Chủ cửa hàng", date: "2025-02-18" }
  ];

  const handleApproveStore = (storeId: string) => {
    updateStoreInfo(storeId, { verified: true });
    alert("Đã duyệt cửa hàng đối tác thành công!");
  };

  const handleRejectStore = (storeId: string) => {
    // Soft-reject by warning or removing (mocking reject is just leaving it unverified or deleting)
    updateStoreInfo(storeId, { verified: false, name: `${stores.find(s=>s.id === storeId)?.name} (Bị từ chối)` });
    alert("Đã từ chối hồ sơ đăng ký kinh doanh của cửa hàng.");
  };

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case "processing": return "Đang gói hàng";
      case "shipped": return "Đang giao";
      case "completed": return "Đã giao";
      default: return "Chờ xử lý";
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "processing": return "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30";
      case "shipped": return "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30";
      case "completed": return "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30";
      default: return "bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border border-stone-250 dark:border-stone-800";
    }
  };

  return (
    <div className="space-y-8 pb-20 text-stone-800 dark:text-stone-100">
      
      {/* Intro Portal header */}
      <div className="space-y-2">
        <span className="text-xs text-emerald-600 dark:text-emerald-500 font-mono tracking-widest uppercase font-semibold">CỔNG QUẢN TRỊ ADMIN</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-450" />
          Hệ Thống Kiểm Soát Sinh Thái GreenLife
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm max-w-2xl leading-relaxed">
          Quản lý xét duyệt cửa hàng đối tác, cấu trúc nhóm ngành sản phẩm, giám sát lịch khảo sát nông nghiệp và trạng thái hệ thống.
        </p>
      </div>

      {/* Dashboard Sub-navigation Tabs */}
      <div className="flex flex-wrap border-b border-stone-200 dark:border-stone-850 pb-2 gap-2 sm:gap-4">
        {[
          { id: "overview", label: "Tổng quan", icon: Cpu },
          { id: "stores", label: "Duyệt cửa hàng", icon: Store, count: pendingStores.length },
          { id: "users", label: "Quản lý người dùng", icon: Users },
          { id: "products", label: "Quản lý sản phẩm", icon: ShoppingBag },
          { id: "orders", label: "Quản lý đơn hàng", icon: ShoppingBag },
          { id: "bookings", label: "Quản lý booking", icon: Calendar }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected 
                  ? "bg-emerald-500 text-black shadow-sm" 
                  : "bg-stone-100 dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  isSelected ? "bg-black text-emerald-400" : "bg-amber-500 text-black"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* RENDER VIEW CORRESPONDING TO ACTIVE TAB */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Stats metrics scoreboard */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: stores.length.toString(), desc: "Đối tác liên kết", icon: Store, sub: "Bao gồm cả các vườn chờ duyệt" },
              { title: products.length.toString(), desc: "Mặt hàng niêm yết", icon: ShoppingBag, sub: "Cây giống & chất dinh dưỡng xanh" },
              { title: mockUsers.length.toString(), desc: "Thành viên cổng", icon: Users, sub: "Khách hàng & nhà phân phối" },
              { title: appointments.length.toString(), desc: "Lịch hẹn dịch vụ", icon: Calendar, sub: "Tư vấn & khảo sát trực địa" }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-stone-50 dark:bg-stone-905 border border-stone-200 dark:border-stone-850 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-stone-500 font-mono text-[10px] uppercase tracking-wider">{stat.desc}</span>
                    <Icon className="h-4.5 w-4.5 text-stone-400" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-3 block tracking-tight">{stat.title}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">{stat.sub}</span>
                </div>
              );
            })}
          </section>

          {/* Growth Chart */}
          <div className="bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-850 p-6 sm:p-8 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase">
              Thống Kê Khử Carbon Qua Các Năm Ở Địa Phương (Tấn CO2)
            </h3>
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={offsetHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--stone-200)" dark:stroke="#222" strokeDasharray="3 3" />
                  <XAxis dataKey="year" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--stone-950)", borderColor: "var(--stone-850)", borderRadius: "12px" }}
                    labelStyle={{ color: "#fff", fontSize: "12px" }}
                    itemStyle={{ color: "var(--emerald-400)", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="LamDong" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2.5} name="Lâm Đồng" />
                  <Area type="monotone" dataKey="HaNoi" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} strokeWidth={1.5} name="Ban Công Hà Nội" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. STORE APPROVALS (PENDING REVIEW / MAPS TO /admin/stores/pending) */}
      {activeTab === "stores" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Pending stores list */}
          <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm">
            <div>
              <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                Yêu cầu duyệt nhà vườn đối tác (Pending Store Verification)
              </h3>
              <p className="text-[10px] text-stone-500 mt-1">Các hồ sơ đăng ký bán hàng cần Admin xác nhận nguồn cung thực vật và tiêu chuẩn bao bì hữu cơ.</p>
            </div>

            {pendingStores.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-xs">
                🎉 Không có hồ sơ nhà vườn nào đang chờ duyệt.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {pendingStores.map((store) => (
                  <div key={store.id} className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-stone-800 dark:text-stone-100">{store.name}</h4>
                        <p className="text-[10px] text-stone-500 mt-0.5">Chủ vườn: {store.ownerName} ({store.ownerEmail})</p>
                        <p className="text-[10px] text-stone-500 font-mono mt-0.5">📍 {store.address}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-mono uppercase font-bold border border-amber-200 dark:border-amber-900/30">
                        Chờ duyệt
                      </span>
                    </div>

                    <div className="text-[10px] text-stone-600 dark:text-stone-400 leading-relaxed bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-200 dark:border-stone-850">
                      <strong>Mô tả:</strong> Cửa hàng đăng ký phân phối các giống thực vật nông học tự canh tác và sử dụng bao bì sinh học tự hủy thân thiện môi trường.
                    </div>

                    <div className="flex gap-2 pt-2 mt-auto">
                      <button
                        onClick={() => handleApproveStore(store.id)}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all uppercase"
                      >
                        <Check className="h-3 w-3" />
                        Duyệt cửa hàng
                      </button>
                      <button
                        onClick={() => handleRejectStore(store.id)}
                        className="py-2 px-3 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 font-semibold rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all uppercase"
                      >
                        <X className="h-3 w-3" />
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved stores list */}
          <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase">
              Danh sách nhà vườn đang hoạt động ({approvedStores.length})
            </h3>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left text-stone-650 dark:text-stone-300">
                <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase font-mono text-[9px]">
                  <tr>
                    <th className="p-3">Tên nhà vườn</th>
                    <th className="p-3">Chủ vườn</th>
                    <th className="p-3">Khu vực</th>
                    <th className="p-3 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
                  {approvedStores.map((store) => (
                    <tr key={store.id} className="hover:bg-stone-100/50 dark:hover:bg-stone-900/40">
                      <td className="p-3 font-semibold text-stone-800 dark:text-stone-100">{store.name}</td>
                      <td className="p-3">{store.ownerName} ({store.ownerEmail})</td>
                      <td className="p-3">{store.city}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono font-bold uppercase border border-emerald-250 dark:border-emerald-900/30">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. USER MANAGEMENT TAB */}
      {activeTab === "users" && (
        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm animate-fadeIn">
          <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase">
            Quản Lý Người Dùng Hệ Thống
          </h3>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-stone-650 dark:text-stone-300">
              <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-805 text-stone-500 uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-3">Họ tên thành viên</th>
                  <th className="p-3">Email liên hệ</th>
                  <th className="p-3">Vai trò</th>
                  <th className="p-3 text-right">Ngày đăng ký</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
                {mockUsers.map((u, idx) => (
                  <tr key={idx} className="hover:bg-stone-105/50 dark:hover:bg-stone-900/40">
                    <td className="p-3 font-semibold text-stone-800 dark:text-stone-100">{u.name}</td>
                    <td className="p-3 font-mono text-stone-500">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                        u.role === "Quản trị viên" 
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400" 
                          : u.role === "Chủ cửa hàng" 
                            ? "bg-amber-105 dark:bg-amber-955 text-amber-800 dark:text-amber-400" 
                            : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-stone-550">{u.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PRODUCT MANAGEMENT TAB */}
      {activeTab === "products" && (
        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm animate-fadeIn">
          <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase">
            Danh Mục Sản Phẩm Đang Niêm Yết
          </h3>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-stone-650 dark:text-stone-300">
              <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-805 text-stone-500 uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-3">Tên sản phẩm</th>
                  <th className="p-3">Danh mục</th>
                  <th className="p-3">Đơn giá</th>
                  <th className="p-3">Đánh giá</th>
                  <th className="p-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-105/50 dark:hover:bg-stone-900/40">
                    <td className="p-3 font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                      <img src={p.image} alt={p.name} className="w-7 h-7 object-cover rounded-md" />
                      {p.name}
                    </td>
                    <td className="p-3 font-mono text-stone-500 text-[10px] uppercase">{p.category}</td>
                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-450">{p.price.toLocaleString("vi-VN")}₫</td>
                    <td className="p-3 font-mono">⭐ {p.rating}</td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => alert("Sản phẩm demo không được xóa trực tiếp tại đây.")}
                        className="p-1.5 text-stone-400 hover:text-rose-500 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ORDER MANAGEMENT TAB */}
      {activeTab === "orders" && (
        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm animate-fadeIn">
          <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase">
            Quản Lý Các Đơn Hàng Giao Dịch
          </h3>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-stone-650 dark:text-stone-300">
              <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-805 text-stone-500 uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-3">Mã đơn hàng</th>
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Ngày mua</th>
                  <th className="p-3">Tổng giá</th>
                  <th className="p-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
                {INITIAL_ORDERS.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-105/50 dark:hover:bg-stone-900/40">
                    <td className="p-3 font-mono font-semibold text-stone-800 dark:text-stone-100">{o.id}</td>
                    <td className="p-3">{o.customerName}</td>
                    <td className="p-3 font-mono text-stone-500">{o.date}</td>
                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-450">{o.total.toLocaleString("vi-VN")}₫</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-semibold ${getOrderStatusColor(o.status)}`}>
                        {getOrderStatusLabel(o.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. BOOKING MANAGEMENT TAB */}
      {activeTab === "bookings" && (
        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl space-y-4 shadow-sm animate-fadeIn">
          <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-wider uppercase">
            Quản Lý Lịch Tư Vấn Với Chuyên Gia Nông Học
          </h3>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-stone-650 dark:text-stone-300">
              <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-805 text-stone-500 uppercase font-mono text-[9px]">
                <tr>
                  <th className="p-3">Chuyên gia</th>
                  <th className="p-3">Dịch vụ yêu cầu</th>
                  <th className="p-3">Ngày giờ đặt</th>
                  <th className="p-3">Chi phí tư vấn</th>
                  <th className="p-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-850">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-stone-105/50 dark:hover:bg-stone-900/40">
                    <td className="p-3 font-semibold text-stone-800 dark:text-stone-100">{a.expertName}</td>
                    <td className="p-3 text-stone-600 dark:text-stone-400">{a.title}</td>
                    <td className="p-3 font-mono text-stone-500">{a.date} - {a.time}</td>
                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-450">{a.price.toLocaleString("vi-VN")}₫</td>
                    <td className="p-3 text-right font-mono">
                      <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-105 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold uppercase border border-emerald-250 dark:border-emerald-900/30">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
