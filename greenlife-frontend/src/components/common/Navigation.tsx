import React, { useState } from "react";
import { Leaf, ShoppingBag, BrainCircuit, Calendar, Newspaper, User, Settings2, Home, Landmark, UserCheck, Sun, Moon, MapPin, Menu, X, LogOut, Cpu, Store, Users, Sprout, TrendingUp, Inbox, FileText } from "lucide-react";

import { useAppContext } from "../../context/AppContext";


interface NavigationProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  cartCount: number;
  userRole: "customer" | "store" | "admin";
  setUserRole: (role: "customer" | "store" | "admin") => void;
  openCart: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  setCurrentPage,
  cartCount,
  userRole,
  setUserRole,
  openCart,
}) => {
  const { theme, toggleTheme, selectedStoreId, stores, currentUser, logout, adminActiveTab, setAdminActiveTab, storeActiveTab, setStoreActiveTab } = useAppContext();

  const matchedStore = stores.find((s) => s.id === selectedStoreId);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = userRole === "admin";
  const isStoreOwner = userRole === "store";

  const navItems = isAdmin
    ? [
        { id: "overview", label: "Tổng Quan Sinh Thái", icon: Cpu },
        { id: "stores", label: "Duyệt Nhà Vườn", icon: Store },
        { id: "users", label: "Quản Lý Thành Viên", icon: Users },
        { id: "products", label: "Danh Mục Sản Phẩm", icon: Sprout },
        { id: "orders", label: "Giao Dịch Đơn Hàng", icon: ShoppingBag },
        { id: "blogs", label: "Cẩm Nang Xanh", icon: FileText },
      ]
    : isStoreOwner
      ? [
          { id: "overview", label: "Tổng Quan Kinh Doanh", icon: TrendingUp },
          { id: "orders", label: "Quản Lý Đơn Hàng", icon: Inbox },
          { id: "products", label: "Niêm Yết Sản Phẩm", icon: Sprout },
          { id: "blogs", label: "Quản Lý Bài Viết", icon: FileText },
          { id: "settings", label: "Cấu hình Nhà Vườn", icon: Settings2 },
          { id: "customer-view-back", label: "Trang Mua Sắm 🛒", icon: Home },
        ]
      : [
          { id: "home", label: "Trang Chủ", icon: Home },
          { id: "shop", label: "Cửa Hàng", icon: ShoppingBag },
          { id: "ai-diagnosis", label: "Bác Sĩ Cây AI", icon: BrainCircuit },
          { id: "booking", label: "Danh Bạ Chuyên Gia", icon: Users },
          { id: "blog", label: "Cẩm Nang Xanh", icon: Newspaper },
        ];

  // Dynamically insert specific role dashboard tab if logged in and not admin/store
  if (currentUser && !isAdmin && !isStoreOwner) {
    navItems.push({ id: "customer-dashboard", label: "Hồ Sơ Của Tôi 👤", icon: UserCheck });
    if (currentUser.is_seller) {
      navItems.push({ id: "store-dashboard", label: "Kênh Người Bán 🌿", icon: Store });
    }
  }


  const handleNavClick = (id: string) => {
    if (isAdmin) {
      const isAdminItem = [
        "overview",
        "stores",
        "users",
        "products",
        "orders",
        "blogs"
      ].includes(id);

      if (isAdminItem) {
        setCurrentPage("admin-dashboard");
        setAdminActiveTab(id as any);
      } else {
        setCurrentPage(id);
      }
    } else if (isStoreOwner) {
      if (id === "customer-view-back") {
        setUserRole("customer");
        setCurrentPage("home");
        setIsMobileMenuOpen(false);
        return;
      }
      const isStoreItem = [
        "overview",
        "orders",
        "products",
        "settings",
        "blogs"
      ].includes(id);

      if (isStoreItem) {
        setCurrentPage("store-dashboard");
        setStoreActiveTab(id as any);
      } else {
        setCurrentPage(id);
      }
    } else {
      if (id === "store-dashboard") {
        setUserRole("store");
        setCurrentPage("store-dashboard");
        setStoreActiveTab("overview");
        setIsMobileMenuOpen(false);
        return;
      }
      setCurrentPage(id);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-stone-950/70 border-b border-emerald-950/20 text-stone-100 transition-colors duration-500 header-glow">
        
        {/* Row 1: Logo (Left), GREEN LIFE (Center), Actions/Profile (Right) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-28 flex items-center justify-between gap-4 relative">
          {/* Logo & Slogan (Left) */}
          <div 
            className="flex items-center gap-4 cursor-pointer group shrink-0 logo-container"
            onClick={() => handleNavClick(isAdmin ? "overview" : isStoreOwner ? "overview" : "home")}
          >
            <div className="p-3 bg-emerald-950/50 rounded-2xl border border-emerald-500/30 group-hover:border-emerald-400 group-hover:bg-emerald-900/50 transition-all shadow-lg shadow-emerald-950/40">
              <Leaf className="h-9 w-9 text-emerald-400 logo-icon animate-leaf-float" />
            </div>
            <div className="relative">
              <span className="font-display font-medium text-3xl tracking-tight text-stone-100 flex items-center gap-0.5 brand-logo-text select-none">
                Green<span className="text-emerald-400 font-extrabold brand-logo-text-highlight brand-logo-shimmer">Life</span>
              </span>
              <p className="text-[11px] text-emerald-500 tracking-[0.15em] font-mono font-semibold transition-all duration-300 group-hover:text-emerald-400">ECO-TECH LUXURY</p>
            </div>
          </div>

          {/* GREEN LIFE Styled Title in Absolute Center with Premium Shimmer & Hover Spacing */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 text-4xl font-extrabold tracking-[0.3em] font-display select-none">
            <span className="brand-text-shimmer">GREEN LIFE</span>
          </div>

          {/* Quick Actions Bar (Right) */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            
            {/* Shopee-style back to buyer shortcut */}
            {isStoreOwner && (
              <button
                onClick={() => {
                  setUserRole("customer");
                  setCurrentPage("home");
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/35 hover:border-emerald-400 rounded-xl text-xs font-bold transition-all shadow-sm tracking-wide cursor-pointer btn-animated animate-badge-pop"
                title="Quay lại giao diện mua sắm cho khách hàng"
              >
                <Home className="w-3.5 h-3.5 text-emerald-400" />
                Vào Trang Mua Sắm
              </button>
            )}
            
            {/* Store Indicator */}
            {matchedStore && (
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-[10px] text-stone-400 font-mono">
                <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="line-clamp-1 max-w-[150px]">
                  Vườn: <strong className="text-emerald-400 font-semibold">{matchedStore.name.replace("Nhà Vườn ", "").replace("Cửa Hàng ", "")}</strong>
                </span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-850 text-stone-300 hover:text-stone-100 border border-stone-700/40 transition-all cursor-pointer btn-animated shadow-xs"
              aria-label="Đổi giao diện"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 text-indigo-500 hover:text-indigo-600 hover:scale-110 transition-all duration-300 drop-shadow-[0_0_4px_rgba(79,70,229,0.3)]" />
              ) : (
                <Sun className="h-5 w-5 text-amber-400 hover:text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              )}
            </button>

            {/* Cart Button with ambient pulse when not empty */}
            <button
              onClick={openCart}
              className={`relative p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-850 text-stone-300 hover:text-stone-100 border border-stone-700/40 transition-all cursor-pointer btn-animated shadow-xs ${
                cartCount > 0 ? "cart-glow-pulse" : ""
              }`}
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className="h-5 w-5 text-emerald-500 hover:text-emerald-450 hover:scale-110 transition-all duration-300" />
              {cartCount > 0 && (
                <span key={cartCount} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black border-2 border-stone-900 shadow-md animate-badge-pop">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Avatar trigger */}
            <button
              onClick={() => {
                if (currentUser) {
                  if (userRole === "admin") handleNavClick("admin-dashboard");
                  else if (userRole === "store") handleNavClick("store-dashboard");
                  else handleNavClick("customer-dashboard");
                } else {
                  handleNavClick("auth");
                }
              }}
              className={`p-2.5 rounded-xl text-stone-300 hover:text-stone-100 border cursor-pointer transition-all btn-animated ${
                currentPage === "auth" || currentPage.includes("dashboard")
                  ? "bg-emerald-950 text-emerald-400 border-emerald-500/30"
                  : "bg-stone-800/80 hover:bg-stone-850 border-stone-700/40"
              } ${
                currentUser 
                  ? userRole === "admin" 
                    ? "border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)]" 
                    : userRole === "store" 
                      ? "border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]" 
                      : "border-teal-500/50"
                  : ""
              }`}
              title={currentUser ? `Tài khoản: ${currentUser.name} (${userRole})` : "Tài khoản / Đăng nhập"}
            >
              <User className={`h-5 w-5 ${userRole === "admin" ? "text-amber-400" : ""}`} />
            </button>
            
            {currentUser && (
              <button
                onClick={logout}
                className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-rose-950/30 text-stone-300 hover:text-rose-450 border border-stone-700/40 hover:border-rose-900/30 transition-all cursor-pointer btn-animated"
                title="Đăng xuất"
              >
                <LogOut className="h-5 w-5 text-rose-500/80 group-hover:text-rose-400" />
              </button>
            )}

          </div>


          {/* Mobile hamburger icon trigger */}
          <div className="flex md:hidden items-center gap-2">
            {/* Cart Button */}
            <button
              onClick={openCart}
              className={`relative p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-850 text-stone-300 hover:text-stone-100 border border-stone-700/40 transition-all cursor-pointer animate-badge-pop shadow-xs ${
                cartCount > 0 ? "cart-glow-pulse" : ""
              }`}
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className="h-5 w-5 text-emerald-500 hover:text-emerald-450 hover:scale-110 transition-all duration-300" />
              {cartCount > 0 && (
                <span key={cartCount} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black border-2 border-stone-900 shadow-md animate-badge-pop">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl bg-stone-800/80 text-stone-300 hover:text-stone-100 border border-stone-700/40 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Row 2: Centered Desktop Navigation Tabs (Wireframe Alignment) */}
        <div className="hidden lg:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 items-center justify-center border-t border-emerald-950/10">
          <nav className="flex items-center gap-1.5 xl:gap-2">
            {navItems.filter((item) => item.id !== "customer-view-back").map((item) => {
              const Icon = item.icon;
              const isActive = isAdmin
                ? (currentPage === "admin-dashboard" && adminActiveTab === item.id)
                : isStoreOwner
                  ? (currentPage === "store-dashboard" && storeActiveTab === item.id)
                  : (currentPage === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer nav-item-animated transition-all ${
                    isActive
                      ? "active bg-emerald-950/60 text-emerald-400 border border-emerald-500/15 shadow-sm"
                      : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 nav-icon" />
                    {item.label}
                  </div>
                  {isActive && <span className="nav-active-dot" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-stone-850 bg-stone-950 p-4 space-y-4 animate-slide-down">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isAdmin
                  ? (currentPage === "admin-dashboard" && adminActiveTab === item.id)
                  : isStoreOwner
                    ? (currentPage === "store-dashboard" && storeActiveTab === item.id)
                    : (currentPage === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium w-full text-left cursor-pointer nav-item-animated ${
                      isActive
                        ? "active bg-emerald-950/80 text-emerald-400 border border-emerald-500/20"
                        : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 nav-icon" />
                      {item.label}
                    </div>
                    {isActive && <span className="nav-active-dot mr-1" />}
                  </button>
                );
              })}
            </nav>

            {/* Store Indicator in Mobile */}
            {matchedStore && (
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-xs text-stone-300 font-mono">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Đang chọn vườn: <strong className="text-emerald-400 font-semibold">{matchedStore.name}</strong>
                </span>
              </div>
            )}

            {/* Bottom Actions grid */}
            <div className={`grid ${currentUser ? "grid-cols-3" : "grid-cols-2"} gap-2 pt-2 border-t border-stone-850`}>
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-800 text-stone-300 border border-stone-700/60 text-[10px] font-semibold cursor-pointer btn-animated"
              >
                {theme === "light" ? <Moon className="w-3.5 h-3.5 text-stone-500" /> : <Sun className="w-3.5 h-3.5 text-yellow-400" />}
                {theme === "light" ? "Tối" : "Sáng"} Giao Diện
              </button>

              {/* Profile */}
              <button
                onClick={() => {
                  if (currentUser) {
                    if (userRole === "admin") handleNavClick("admin-dashboard");
                    else if (userRole === "store") handleNavClick("store-dashboard");
                    else handleNavClick("customer-dashboard");
                  } else {
                    handleNavClick("auth");
                  }
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-800 text-stone-300 border border-stone-700/60 text-[10px] font-semibold cursor-pointer btn-animated"
              >
                <User className="w-3.5 h-3.5" />
                Tài Khoản
              </button>

              {/* Logout (Mobile) */}
              {currentUser && (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-800 hover:bg-rose-950/20 text-stone-300 hover:text-rose-450 border border-stone-700/60 hover:border-rose-900/20 text-[10px] font-semibold cursor-pointer btn-animated"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  Đăng xuất
                </button>
              )}
            </div>

          </div>
        )}

        {/* Desktop Role Quick Ribbon and Alerts with Shimmer Effect */}
        <div className="border-t border-emerald-900/15 px-4 py-2.5 shimmer-ribbon">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-stone-300">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]"></span>
              <p className="text-light text-stone-300 font-medium">
                Cam kết môi trường: <strong className="text-emerald-400 font-bold">100%</strong> canh tác hữu cơ bền vững Việt Nam
              </p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export const Footer: React.FC<{ setCurrentPage: (p: string) => void }> = ({ setCurrentPage }) => {
  return (
    <footer className="bg-stone-950 border-t border-stone-900 text-stone-400 py-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <span className="font-display font-medium text-lg text-stone-100 tracking-tight">
            Green<span className="text-emerald-400 font-bold">Life</span>
          </span>
          <p className="mt-4 text-sm leading-relaxed text-stone-500">
            Nền tảng sinh thái tích hợp AI chuyên chẩn đoán, hỗ trợ vườn nhà và kết nối cung ứng sản phẩm organic thân thiện với môi trường Việt Nam.
          </p>
          <div className="mt-5 text-[11px] font-mono text-emerald-500/80">
            © 2026 GREENLIFE CORP • BẰNG SÁNG CHẾ VIỆT NAM
          </div>
        </div>

        <div>
          <h4 className="font-display font-medium text-stone-100 text-sm tracking-wider uppercase">Dịch vụ cốt lõi</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <button onClick={() => setCurrentPage("ai-diagnosis")} className="hover:text-emerald-400 transition-colors">
                Bác sĩ cây trồng AI (Gemini 3.5)
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage("shop")} className="hover:text-emerald-400 transition-colors">
                Thương mại điện tử hữu cơ
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage("booking")} className="hover:text-emerald-400 transition-colors">
                Danh bạ chuyên gia nông nghiệp
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage("blog")} className="hover:text-emerald-400 transition-colors">
                Truyền thông & Đào tạo xanh
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-medium text-stone-100 text-sm tracking-wider uppercase">Quy chuẩn cam kết</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <span className="text-stone-500 block">Tiêu chuẩn canh tác:</span>
              <span className="text-stone-200 text-xs font-mono">Organic Việt Nam & Global GAP</span>
            </li>
            <li>
              <span className="text-stone-500 block">Đóng gói bền vững:</span>
              <span className="text-stone-200 text-xs font-mono">100% Túi tự phân hủy sinh học</span>
            </li>
            <li>
              <span className="text-stone-500 block">Lượng carbon tích lũy:</span>
              <span className="text-emerald-400 text-xs font-mono">-750,000 kg CO2đã trung hòa</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-medium text-stone-100 text-sm tracking-wider uppercase">Liên hệ bản địa</h4>
          <p className="mt-4 text-sm leading-relaxed text-stone-500">
            Hợp tác xã Công nghệ xanh Hòa Lạc, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội, Việt Nam.
          </p>
          <p className="mt-2 text-sm text-emerald-400 font-mono">
            hotline: 1800-ECO-GREEN
          </p>
        </div>
      </div>
    </footer>
  );
};










