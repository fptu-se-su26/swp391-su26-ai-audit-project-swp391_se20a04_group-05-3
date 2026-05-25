import React from "react";
import { Leaf, ShoppingBag, BrainCircuit, Calendar, Newspaper, User, Settings2, Home, Landmark, UserCheck } from "lucide-react";

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
  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-stone-900/90 border-b border-emerald-900/30 text-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Slogan */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => setCurrentPage("home")}
          >
            <div className="p-2.5 bg-emerald-950/50 rounded-xl border border-emerald-500/30 group-hover:border-emerald-400 group-hover:bg-emerald-900/50 transition-all shadow-md shadow-emerald-950">
              <Leaf className="h-6 w-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <span className="font-display font-medium text-xl tracking-tight text-white flex items-center gap-1.5">
                Green<span className="text-emerald-400 font-bold">Life</span>
              </span>
              <p className="text-[10px] text-emerald-500 tracking-wider font-mono">ECO-TECH LUXURY</p>
            </div>
          </div>

          {/* Core Desktop Navigation links */}
          <nav className="hidden md:flex items-center gap-1 xl:gap-2">
            {[
              { id: "home", label: "Trang Chủ", icon: Home },
              { id: "shop", label: "Cửa Hàng", icon: ShoppingBag },
              { id: "ai-diagnosis", label: "Bác Sĩ Cây AI", icon: BrainCircuit },
              { id: "booking", label: "Đặt Lịch Chuyên Gia", icon: Calendar },
              { id: "blog", label: "Cẩm Nang Xanh", icon: Newspaper },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/20 shadow-sm"
                      : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/40 transition-all mr-1"
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
            <div className="flex items-center bg-stone-950 p-1.5 rounded-xl border border-stone-800 gap-1.5">
              <span className="hidden lg:inline text-[10px] font-mono text-stone-500 px-1">QUYỀN:</span>
              <select
                value={userRole}
                onChange={(e) => {
                  const role = e.target.value as "customer" | "store" | "admin";
                  setUserRole(role);
                  if (role === "customer") setCurrentPage("customer-dashboard");
                  else if (role === "store") setCurrentPage("store-dashboard");
                  else if (role === "admin") setCurrentPage("admin-dashboard");
                }}
                className="bg-stone-900 text-xs text-white border-0 py-1 px-2.5 rounded-lg focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium focus:outline-none"
              >
                <option value="customer">Khách Hàng</option>
                <option value="store">Chủ Nhà Vườn</option>
                <option value="admin">Quản Trị Hệ Thống</option>
              </select>
            </div>

            {/* Profile Avatar trigger */}
            <button
              onClick={() => setCurrentPage("auth")}
              className={`p-2.5 rounded-xl text-stone-300 hover:text-white border transition-all ${
                currentPage === "auth"
                  ? "bg-emerald-950 text-emerald-400 border-emerald-500/30"
                  : "bg-stone-800/80 hover:bg-stone-800 border-stone-700/40"
              }`}
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>

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
              <span className="hover:text-stone-300 cursor-pointer" onClick={() => setCurrentPage("customer-dashboard")}>Dashboard Khách</span>
              <span>•</span>
              <span className="hover:text-stone-300 cursor-pointer" onClick={() => setCurrentPage("store-dashboard")}>Nhà Vườn Portal</span>
              <span>•</span>
              <span className="hover:text-stone-300 cursor-pointer" onClick={() => setCurrentPage("admin-dashboard")}>Ecology Admin</span>
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
          <span className="font-display font-medium text-lg text-white tracking-tight">
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
          <h4 className="font-display font-medium text-white text-sm tracking-wider uppercase">Dịch vụ cốt lõi</h4>
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
          <h4 className="font-display font-medium text-white text-sm tracking-wider uppercase">Quy chuẩn cam kết</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <span className="text-stone-500 block">Tiêu chuẩn canh tác:</span>
              <span className="text-white text-xs font-mono">Organic Việt Nam & Global GAP</span>
            </li>
            <li>
              <span className="text-stone-500 block">Đóng gói bền vững:</span>
              <span className="text-white text-xs font-mono">100% Túi tự phân hủy sinh học</span>
            </li>
            <li>
              <span className="text-stone-500 block">Lượng carbon tích lũy:</span>
              <span className="text-emerald-400 text-xs font-mono">-750,000 kg CO2đã trung hòa</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-medium text-white text-sm tracking-wider uppercase">Liên hệ bản địa</h4>
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
