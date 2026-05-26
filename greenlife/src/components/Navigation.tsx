import React, { useState } from "react";
import { Leaf, ShoppingBag, BrainCircuit, Calendar, Newspaper, User, Settings2, Home, Landmark, UserCheck, Sun, Moon, MapPin, Menu, X } from "lucide-react";
import { useAppContext } from "../context/AppContext";

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
  const { theme, toggleTheme, selectedStoreId, stores, currentUser } = useAppContext();
  const matchedStore = stores.find((s) => s.id === selectedStoreId);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Trang Chủ", icon: Home },
    { id: "shop", label: "Cửa Hàng", icon: ShoppingBag },
    { id: "ai-diagnosis", label: "Bác Sĩ Cây AI", icon: BrainCircuit },
    { id: "booking", label: "Đặt Lịch Chuyên Gia", icon: Calendar },
    { id: "blog", label: "Cẩm Nang Xanh", icon: Newspaper },
  ];

  const handleNavClick = (id: string) => {
    setCurrentPage(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-stone-950/90 border-b border-stone-850 text-stone-100 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Slogan */}
          <div 
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            onClick={() => handleNavClick("home")}
          >
            <div className="p-2.5 bg-emerald-950/50 rounded-xl border border-emerald-500/30 group-hover:border-emerald-400 group-hover:bg-emerald-900/50 transition-all shadow-md shadow-emerald-950">
              <Leaf className="h-6 w-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <span className="font-display font-medium text-xl tracking-tight text-stone-100 flex items-center gap-1.5">
                Green<span className="text-emerald-400 font-bold">Life</span>
              </span>
              <p className="text-[10px] text-emerald-500 tracking-wider font-mono">ECO-TECH LUXURY</p>
            </div>
          </div>

          {/* Core Desktop Navigation links */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/20 shadow-sm"
                      : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions Bar */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            
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
              className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-850 text-stone-300 hover:text-stone-100 border border-stone-700/40 transition-all cursor-pointer"
              aria-label="Đổi giao diện"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 text-stone-500 hover:text-stone-700" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-400" />
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-850 text-stone-300 hover:text-stone-100 border border-stone-700/40 transition-all cursor-pointer"
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black border-2 border-stone-900 shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
 
            {/* Role & Dashboard Fast Accessor */}
            <div className="relative group flex items-center bg-stone-950 p-1.5 rounded-xl border border-stone-800 gap-1.5">
              <span className="hidden xl:inline text-[10px] font-mono text-stone-500 px-1 cursor-help">Vai trò demo:</span>
              <select
                value={userRole}
                onChange={(e) => {
                  const role = e.target.value as "customer" | "store" | "admin";
                  setUserRole(role);
                  if (role === "customer") setCurrentPage("customer-dashboard");
                  else if (role === "store") {
                    const myStore = stores.find((s) => s.ownerEmail === currentUser?.email);
                    if (myStore && myStore.verified) {
                      setCurrentPage("store-dashboard");
                    } else {
                      setCurrentPage("store-profile-setup");
                    }
                  }
                  else if (role === "admin") setCurrentPage("admin-dashboard");
                }}
                className="bg-stone-900 text-xs text-stone-200 border-0 py-1 px-2.5 rounded-lg focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium focus:outline-none"
              >
                <option value="customer">Khách Hàng</option>
                <option value="store">Chủ Nhà Vườn</option>
                <option value="admin">Quản Trị Hệ Thống</option>
              </select>
              {/* Custom Tooltip */}
              <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-stone-900 text-[10px] text-stone-300 p-2 rounded-lg border border-stone-800 shadow-xl max-w-[200px] z-50 whitespace-normal leading-normal">
                Chỉ dùng để xem giao diện demo. Khi có backend thật, vai trò sẽ lấy từ tài khoản đăng nhập.
              </div>
            </div>

            {/* Profile Avatar trigger */}
            <button
              onClick={() => handleNavClick("auth")}
              className={`p-2.5 rounded-xl text-stone-300 hover:text-stone-100 border cursor-pointer transition-all ${
                currentPage === "auth"
                  ? "bg-emerald-950 text-emerald-400 border-emerald-500/30"
                  : "bg-stone-800/80 hover:bg-stone-850 border-stone-700/40"
              }`}
            >
              <User className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile hamburger icon trigger */}
          <div className="flex md:hidden items-center gap-2">
            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-850 text-stone-300 hover:text-stone-100 border border-stone-700/40 transition-all cursor-pointer"
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black border-2 border-stone-900 shadow-md">
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

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-stone-850 bg-stone-950 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-left transition-all ${
                      isActive
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/20"
                        : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
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
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-850">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-800 text-stone-300 border border-stone-700/60 text-xs font-semibold cursor-pointer"
              >
                {theme === "light" ? <Moon className="w-4 h-4 text-stone-500" /> : <Sun className="w-4 h-4 text-yellow-400" />}
                {theme === "light" ? "Tối" : "Sáng"} Giao Diện
              </button>

              {/* Profile */}
              <button
                onClick={() => handleNavClick("auth")}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-800 text-stone-300 border border-stone-700/60 text-xs font-semibold cursor-pointer"
              >
                <User className="w-4 h-4" />
                Tài Khoản
              </button>

              {/* Role Select in Mobile */}
              <div className="col-span-2 bg-stone-900 border border-stone-800 p-2.5 rounded-xl space-y-1.5">
                <span className="text-[10px] font-mono text-stone-500 block">Vai trò demo:</span>
                <select
                  value={userRole}
                  onChange={(e) => {
                    const role = e.target.value as "customer" | "store" | "admin";
                    setUserRole(role);
                    setIsMobileMenuOpen(false);
                    if (role === "customer") setCurrentPage("customer-dashboard");
                    else if (role === "store") {
                      const myStore = stores.find((s) => s.ownerEmail === currentUser?.email);
                      if (myStore && myStore.verified) {
                        setCurrentPage("store-dashboard");
                      } else {
                        setCurrentPage("store-profile-setup");
                      }
                    }
                    else if (role === "admin") setCurrentPage("admin-dashboard");
                  }}
                  className="w-full bg-stone-950 text-xs text-stone-200 py-2 px-3 border border-stone-850 rounded-lg focus:outline-none"
                >
                  <option value="customer">Khách Hàng</option>
                  <option value="store">Chủ Nhà Vườn</option>
                  <option value="admin">Quản Trị Hệ Thống</option>
                </select>
                <p className="text-[9px] text-stone-500 leading-tight">
                  (*) Chỉ dùng để xem giao diện demo. Khi có backend thật, vai trò sẽ lấy từ tài khoản đăng nhập.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Role Quick Ribbon and Alerts */}
        <div className="bg-emerald-950/20 border-t border-emerald-900/10 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-stone-300">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <p className="text-light text-stone-400">
                Cam kết môi trường: <strong className="text-emerald-400">100%</strong> canh tác hữu cơ bền vững Việt Nam
              </p>
            </div>
            
            <div className="flex items-center gap-3 font-mono text-[11px] text-stone-500">
              <span className="hover:text-stone-300 cursor-pointer" onClick={() => handleNavClick("customer-dashboard")}>Dashboard Khách</span>
              <span>•</span>
              <span className="hover:text-stone-300 cursor-pointer" onClick={() => handleNavClick("admin-dashboard")}>Ecology Admin</span>
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
                Ươm mầm & thiết kế cảnh quan
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










