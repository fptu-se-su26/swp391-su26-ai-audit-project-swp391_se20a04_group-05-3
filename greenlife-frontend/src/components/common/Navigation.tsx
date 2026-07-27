import React, { useState, useRef, useEffect } from "react";
import { Leaf, ShoppingBag, BrainCircuit, Newspaper, User, Settings2, Home, UserCheck, Sun, Moon, MapPin, Menu, X, LogOut, Cpu, Store, Users, Sprout, TrendingUp, Inbox, FileText, Bell, Trash2, MessageSquare, ShieldAlert, Calendar, Tag, Shield } from "lucide-react";

import { useAppContext } from "../../context/AppContext";
import { NotificationSkeleton } from "./Skeleton";


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
  const {
    theme,
    toggleTheme,
    selectedStoreId,
    stores,
    currentUser,
    logout,
    adminActiveTab,
    setAdminActiveTab,
    storeActiveTab,
    setStoreActiveTab,
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useAppContext();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const [animateCart, setAnimateCart] = useState(false);
  const prevCartCountRef = useRef(cartCount);

  // Scroll-shrink state
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setAnimateCart(true);
      const timer = setTimeout(() => setAnimateCart(false), 500);
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleBellClick = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setNotifLoading(true);
      setNotifError("");
      try {
        await loadNotifications(0, 10, abortControllerRef.current.signal);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setNotifError("Không thể tải thông báo.");
        }
      } finally {
        setNotifLoading(false);
      }
    }
  };

  const matchedStore = stores.find((s) => s.id === selectedStoreId);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Click outside & Escape key handler for profile dropdown
  useEffect(() => {
    if (!isProfileDropdownOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileDropdownOpen]);

  // Click outside & Escape key handler for mobile navigation menu
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

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
        { id: "reviews", label: "Kiểm Duyệt Đánh Giá", icon: MessageSquare },
        { id: "promotions", label: "Khuyến Mãi", icon: Tag },
        { id: "security-logs", label: "Nhật Ký Bảo Mật", icon: ShieldAlert },
      ]
    : isStoreOwner
      ? [
          { id: "overview", label: "Tổng Quan Kinh Doanh", icon: TrendingUp },
          { id: "orders", label: "Quản Lý Đơn Hàng", icon: Inbox },
          { id: "products", label: "Niêm Yết Sản Phẩm", icon: Sprout },
          { id: "services", label: "Dịch vụ & Lịch hẹn", icon: Calendar },
          { id: "blogs", label: "Quản Lý Bài Viết", icon: FileText },
          { id: "reviews", label: "Đánh Giá Khách Hàng", icon: MessageSquare },
          { id: "settings", label: "Cấu hình Nhà Vườn", icon: Settings2 },
          { id: "customer-view-back", label: "Trang Mua Sắm 🛒", icon: Home },
        ]
      : [
          { id: "home", label: "Trang Chủ", icon: Home },
          { id: "shop", label: "Cửa Hàng", icon: ShoppingBag },
          { id: "ai-diagnosis", label: "Bác Sĩ Cây AI", icon: BrainCircuit },
          { id: "booking", label: "Dịch vụ chăm sóc", icon: Users },
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
        "blogs",
        "reviews",
        "security-logs",
        "promotions"
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
        "services",
        "settings",
        "blogs",
        "reviews"
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

  // ── Shared action button classes ───────────────────────────────────────────
  const actionBtnClass =
    "p-2 rounded-xl border transition-all cursor-pointer btn-animated shadow-sm min-h-[40px] min-w-[40px] flex items-center justify-center " +
    "bg-[var(--gl-bg-elevated)] hover:bg-[var(--gl-bg-muted)] border-[var(--gl-border)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)]";

  return (
    <>
      {/* ── MAIN HEADER ─────────────────────────────────────────────────── */}
      <header
        className={`gl-header header-glow ${
          isScrolled
            ? "gl-header-scrolled"
            : "bg-[var(--gl-bg-header)] border-b border-[var(--gl-border-subtle)]"
        }`}
      >
        {/* ── ROW 1: Logo (Col 1) | Desktop Nav (Col 2) | Actions (Col 3) ─────────────── */}
        <div className="w-full px-4 sm:px-6 md:px-8 2xl:px-12 h-[76px] lg:h-[96px] xl:h-[100px] grid grid-cols-[auto_1fr_auto] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">

          {/* Logo (Left - Col 1) */}
          <div 
            className="flex items-center gap-3 cursor-pointer group shrink-0 logo-container justify-self-start"
            onClick={() => handleNavClick(isAdmin ? "overview" : isStoreOwner ? "overview" : "home")}
          >
            <div className="relative flex items-center justify-center w-[48px] h-[48px] lg:w-[64px] lg:h-[64px] xl:w-[68px] xl:h-[68px] p-2 bg-[var(--gl-accent-soft)] rounded-2xl border border-[var(--gl-accent)]/25 group-hover:border-[var(--gl-accent)]/60 group-hover:bg-[var(--gl-accent-soft)] transition-all shadow-sm shrink-0">
              <Leaf className="h-6 w-6 lg:h-9 lg:w-9 xl:h-[36px] xl:w-[36px] text-[var(--gl-accent)] logo-icon gl-brand-leaf" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--gl-accent)] animate-ping opacity-70"></span>
            </div>
            <div className="relative">
              <span className="font-display font-bold text-[22px] lg:text-[30px] xl:text-[32px] tracking-tight text-[var(--gl-text-primary)] flex items-center gap-0.5 brand-logo-text select-none leading-none">
                Green<span className="text-[var(--gl-accent)] font-extrabold brand-logo-text-highlight brand-logo-shimmer">Life</span>
              </span>
              <p className="text-[9px] lg:text-[11px] xl:text-[12px] text-[var(--gl-accent)] tracking-[0.2em] font-bold transition-all duration-300 group-hover:opacity-80 mt-0.5">ECO-TECH</p>
            </div>
          </div>

          {/* Desktop Navigation Wrapper (Col 2 - Center, min-w-0) */}
          <div className="min-w-0 flex items-center justify-center">
            <nav
              className={`hidden lg:flex items-center gap-1 overflow-x-auto gl-nav-scroll py-1 max-w-full ${
                isAdmin || isStoreOwner ? "justify-start" : "justify-center"
              }`}
            >
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
                    role="link"
                    onClick={() => handleNavClick(item.id)}
                    className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer nav-item-animated transition-all whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
                      isActive
                        ? "active bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20 shadow-sm"
                        : "text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4 nav-icon shrink-0" />
                      <span className="hidden xl:inline">{item.label}</span>
                      <span className="xl:hidden text-xs">{item.label.split(" ")[0]}</span>
                    </div>
                    {isActive && <span className="nav-active-dot" />}
                  </button>
                );
              })}
            </nav>
          </div>
            
          {/* Quick Actions & Mobile Controls (Col 3 - Right, shrink-0) */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {/* Desktop Quick Actions */}
            <div className="hidden md:flex items-center gap-2 shrink-0">

              {/* Back to buyer shortcut (store owner) */}
            {isStoreOwner && (
              <button
                onClick={() => {
                  setUserRole("customer");
                  setCurrentPage("home");
                }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gl-accent-soft)] hover:bg-[var(--gl-accent)]/20 text-[var(--gl-accent)] border border-[var(--gl-accent)]/30 hover:border-[var(--gl-accent)]/60 rounded-xl text-xs font-bold transition-all shadow-sm tracking-wide cursor-pointer btn-animated min-h-[40px]"
                title="Quay lại giao diện mua sắm cho khách hàng"
              >
                  <Home className="w-3.5 h-3.5" />
                Vào Trang Mua Sắm
              </button>
            )}
            
            {/* Store Indicator */}
            {matchedStore && (
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] rounded-xl text-[10px] text-[var(--gl-text-muted)]">
                  <MapPin className="h-3 w-3 text-[var(--gl-accent)] shrink-0" />
                  <span className="line-clamp-1 max-w-[130px]">
                    Vườn: <strong className="text-[var(--gl-accent)]">{matchedStore.name.replace("Nhà Vườn ", "").replace("Cửa Hàng ", "")}</strong>
                </span>
              </div>
            )}

              {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
                className={actionBtnClass}
              aria-label="Đổi giao diện"
            >
              {theme === "light" ? (
                  <Moon className="h-4.5 w-4.5 text-indigo-500 drop-shadow-[0_0_4px_rgba(79,70,229,0.3)]" />
              ) : (
                  <Sun className="h-4.5 w-4.5 text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
              )}
            </button>

              {/* Cart */}
            <button
              onClick={openCart}
                className={`relative ${actionBtnClass} ${cartCount > 0 ? "cart-glow-pulse" : ""} ${animateCart ? "animate-cart-zoom-shake" : ""}`}
              aria-label="Giỏ hàng"
            >
                <ShoppingBag className="h-4.5 w-4.5 text-[var(--gl-accent)]" />
              {cartCount > 0 && (
                  <span key={cartCount} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gl-accent)] text-[10px] font-bold text-white border-2 border-[var(--gl-bg-page)] shadow-md animate-badge-pop">
                  {cartCount}
                </span>
              )}
            </button>

              {/* Notification Bell */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={handleBellClick}
                    className={`relative ${actionBtnClass} ${unreadCount > 0 ? "bell-glow-pulse" : ""}`}
                  aria-label="Thông báo"
                >
                    <Bell className="h-4.5 w-4.5 text-[var(--gl-accent)]" />
                  {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-[var(--gl-bg-page)] shadow-md animate-badge-pop">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                      <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl shadow-2xl z-50 overflow-hidden text-[var(--gl-text-secondary)]">
                        {/* Notif header */}
                        <div className="flex items-center justify-between border-b border-[var(--gl-border)] px-4 py-3 bg-[var(--gl-bg-elevated)]">
                          <span className="font-semibold text-sm text-[var(--gl-text-primary)]">Thông báo</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                              className="text-xs text-[var(--gl-accent)] hover:text-[var(--gl-accent-hover)] hover:underline cursor-pointer"
                          >
                            Đánh dấu đã đọc tất cả
                          </button>
                        )}
                      </div>
                        {/* Notif content */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-[var(--gl-border)]">
                        {notifLoading && (
                          <div className="p-4">
                            <NotificationSkeleton />
                          </div>
                        )}
                        {notifError && (
                            <div className="p-6 text-center text-xs text-[var(--gl-danger)]">
                            {notifError}
                          </div>
                        )}
                        {!notifLoading && !notifError && notifications.length === 0 && (
                            <div className="p-8 text-center text-xs text-[var(--gl-text-muted)]">
                            Không có thông báo mới.
                          </div>
                        )}
                        {!notifLoading && !notifError && notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3.5 flex justify-between gap-3 text-xs transition-all relative ${
                                !notif.isRead ? "bg-[var(--gl-accent-soft)] border-l-2 border-[var(--gl-accent)]" : "hover:bg-[var(--gl-bg-muted)]"
                            }`}
                          >
                            <div className="flex-1 space-y-1 cursor-pointer" onClick={() => !notif.isRead && markAsRead(notif.id)}>
                              <div className="flex items-center justify-between">
                                  <span className={`font-semibold ${!notif.isRead ? "text-[var(--gl-text-primary)]" : "text-[var(--gl-text-secondary)]"}`}>
                                  {notif.title}
                                </span>
                                  <span className="text-[10px] text-[var(--gl-text-muted)]">
                                  {new Date(notif.createdAt).toLocaleDateString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </div>
                                <p className="text-[var(--gl-text-muted)] leading-normal line-clamp-2">{notif.message}</p>
                            </div>
                            <button
                              onClick={() => deleteNotification(notif.id)}
                                className="p-1 text-[var(--gl-text-muted)] hover:text-[var(--gl-danger)] transition-colors cursor-pointer shrink-0 self-center"
                              title="Xóa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

              {/* Profile / Login */}
            <div ref={profileDropdownRef} className="relative profile-dropdown-container">
              <button
                onClick={() => {
                  if (currentUser) {
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  } else {
                    handleNavClick("auth");
                  }
                }}
                aria-haspopup="menu"
                aria-expanded={isProfileDropdownOpen}
                aria-controls="profile-menu"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all btn-animated min-h-[40px] ${
                  currentUser
                    ? userRole === "admin"
                      ? "bg-[var(--gl-bg-elevated)] text-[var(--gl-text-primary)] border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                      : userRole === "store"
                        ? "bg-[var(--gl-bg-elevated)] text-[var(--gl-text-primary)] border border-[var(--gl-accent)]/40 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                        : currentPage === "customer-dashboard"
                          ? "bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/30"
                          : "bg-[var(--gl-bg-elevated)] text-[var(--gl-text-primary)] border border-[var(--gl-border)]"
                    : currentPage === "auth"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-md ring-2 ring-emerald-400/70 ring-offset-1 ring-offset-[var(--gl-bg-header)]"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-sm"
                }`}
                title={currentUser ? `Tài khoản: ${currentUser.name} (${userRole})` : "Tài khoản / Đăng nhập"}
              >
                <User
                  className={`h-4 w-4 shrink-0 ${
                    !currentUser
                      ? "text-white"
                      : userRole === "admin"
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-[var(--gl-accent)]"
                  }`}
                />
                {currentUser ? (
                  <span className="hidden md:inline-block text-xs font-medium text-[var(--gl-text-primary)] max-w-[110px] truncate">
                    {(() => {
                      const idStr = currentUser.email || currentUser.name || "";
                      if (!idStr) return "";
                      if (idStr.includes("@")) {
                        const [local, domain] = idStr.split("@");
                        const prefix = local.length > 3 ? local.slice(0, 3) : local;
                        return `${prefix}...@${domain}`;
                      }
                      return idStr.length > 5 ? `${idStr.slice(0, 5)}...` : idStr;
                    })()}
                  </span>
                ) : (
                  <span className="text-white font-semibold">Đăng nhập</span>
                )}
              </button>

              {currentUser && isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                  <div
                    id="profile-menu"
                    role="menu"
                      className="absolute right-0 mt-3 w-56 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl shadow-2xl z-50 overflow-hidden text-[var(--gl-text-secondary)] animate-in fade-in slide-in-from-top-5 duration-200"
                  >
                      <div className="px-4 py-3 border-b border-[var(--gl-border)] bg-[var(--gl-bg-elevated)]">
                        <p className="text-xs font-bold text-[var(--gl-text-primary)] truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-[var(--gl-text-muted)] truncate mt-0.5">{currentUser.email}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[8px] bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] font-bold uppercase tracking-wider">
                        {userRole === "admin" ? "Admin" : userRole === "store" ? "Đối tác" : "Thành viên"}
                      </span>
                    </div>
                    <div className="py-1">
                      <button
                        role="menuitem"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          if (userRole === "admin") handleNavClick("admin-dashboard");
                          else if (userRole === "store") handleNavClick("store-dashboard");
                          else handleNavClick("customer-dashboard");
                        }}
                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--gl-bg-elevated)] hover:text-[var(--gl-text-primary)] transition-colors flex items-center gap-2 cursor-pointer font-medium"
                      >
                          <User className="w-4 h-4 text-[var(--gl-accent)]" />
                        Trang cá nhân
                      </button>

                      {currentUser.is_seller && userRole === "customer" && (
                        <button
                          role="menuitem"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setUserRole("store");
                            setCurrentPage("store-dashboard");
                            setStoreActiveTab("overview");
                          }}
                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--gl-bg-elevated)] hover:text-[var(--gl-text-primary)] transition-colors flex items-center gap-2 cursor-pointer font-medium"
                        >
                            <Store className="w-4 h-4 text-[var(--gl-accent)]" />
                          Kênh người bán
                        </button>
                      )}

                      {!currentUser.is_seller && userRole === "customer" && (
                        <button
                          role="menuitem"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setCurrentPage("store-profile-setup");
                          }}
                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--gl-bg-elevated)] hover:text-[var(--gl-text-primary)] transition-colors flex items-center gap-2 cursor-pointer font-medium"
                        >
                            <Store className="w-4 h-4 text-[var(--gl-accent)]" />
                          Đăng ký bán hàng
                        </button>
                      )}
                    </div>
                      <div className="border-t border-[var(--gl-border)] py-1 bg-[var(--gl-bg-elevated)]/50">
                      <button
                        role="menuitem"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          logout();
                        }}
                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--gl-bg-elevated)] hover:text-[var(--gl-danger)] transition-colors flex items-center gap-2 cursor-pointer font-medium text-[var(--gl-danger)]"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

            {/* Mobile controls */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              {/* Mobile Notification Bell */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={handleBellClick}
                    className={`relative p-2.5 rounded-xl bg-[var(--gl-bg-elevated)] hover:bg-[var(--gl-bg-muted)] text-[var(--gl-text-secondary)] border border-[var(--gl-border)] transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    unreadCount > 0 ? "bell-glow-pulse" : ""
                  }`}
                  aria-label="Thông báo"
                >
                    <Bell className="h-5 w-5 text-[var(--gl-accent)]" />
                  {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-[var(--gl-bg-page)] shadow-md animate-badge-pop">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                      <div className="absolute right-0 mt-3 w-72 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl shadow-2xl z-50 overflow-hidden text-[var(--gl-text-secondary)]">
                        <div className="flex items-center justify-between border-b border-[var(--gl-border)] px-4 py-3 bg-[var(--gl-bg-elevated)]">
                          <span className="font-semibold text-sm text-[var(--gl-text-primary)]">Thông báo</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                              className="text-xs text-[var(--gl-accent)] hover:underline cursor-pointer"
                          >
                            Đã đọc tất cả
                          </button>
                        )}
                      </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-[var(--gl-border)]">
                        {notifLoading && (
                          <div className="p-4">
                            <NotificationSkeleton />
                          </div>
                        )}
                        {notifError && (
                            <div className="p-4 text-center text-xs text-[var(--gl-danger)]">
                            {notifError}
                          </div>
                        )}
                        {!notifLoading && !notifError && notifications.length === 0 && (
                            <div className="p-6 text-center text-xs text-[var(--gl-text-muted)]">
                            Không có thông báo.
                          </div>
                        )}
                        {!notifLoading && !notifError && notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3 flex justify-between gap-2 text-xs transition-all relative ${
                                !notif.isRead ? "bg-[var(--gl-accent-soft)] border-l-2 border-[var(--gl-accent)]" : "hover:bg-[var(--gl-bg-muted)]"
                            }`}
                          >
                            <div className="flex-1 space-y-0.5 cursor-pointer" onClick={() => !notif.isRead && markAsRead(notif.id)}>
                              <div className="flex items-center justify-between">
                                  <span className={`font-semibold line-clamp-1 ${!notif.isRead ? "text-[var(--gl-text-primary)]" : "text-[var(--gl-text-secondary)]"}`}>
                                  {notif.title}
                                </span>
                                  <span className="text-[9px] text-[var(--gl-text-muted)]">
                                  {new Date(notif.createdAt).toLocaleDateString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </div>
                                <p className="text-[var(--gl-text-muted)] leading-normal line-clamp-2">{notif.message}</p>
                            </div>
                            <button
                              onClick={() => deleteNotification(notif.id)}
                                className="p-1 text-[var(--gl-text-muted)] hover:text-[var(--gl-danger)] transition-colors cursor-pointer shrink-0 self-center"
                              title="Xóa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

              {/* Mobile Cart */}
            <button
              onClick={openCart}
                className={`relative p-2.5 rounded-xl bg-[var(--gl-bg-elevated)] hover:bg-[var(--gl-bg-muted)] text-[var(--gl-text-secondary)] border border-[var(--gl-border)] transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                cartCount > 0 ? "cart-glow-pulse" : ""
              } ${animateCart ? "animate-cart-zoom-shake" : ""}`}
              aria-label="Giỏ hàng"
            >
                <ShoppingBag className="h-5 w-5 text-[var(--gl-accent)]" />
              {cartCount > 0 && (
                  <span key={cartCount} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gl-accent)] text-[10px] font-bold text-white border-2 border-[var(--gl-bg-page)] shadow-md animate-badge-pop">
                  {cartCount}
                </span>
              )}
            </button>
            </div>

            {/* Hamburger Trigger (visible at < 1024px i.e. mobile & tablet, hidden at >= 1024px) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl bg-[var(--gl-bg-elevated)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] border border-[var(--gl-border)] cursor-pointer min-h-[44px] min-w-[44px] flex lg:hidden items-center justify-center"
              aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── ROW 2: Eco-Commitment Ribbon (compact 28px) ─────────────── */}
        <div className="border-t border-[var(--gl-border-subtle)] h-[28px] flex items-center shimmer-ribbon bg-[var(--gl-bg-muted)]/40">
          <div className="w-full px-4 sm:px-6 md:px-8 2xl:px-12 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--gl-text-muted)]">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--gl-accent)] animate-pulse shadow-[0_0_6px_#10b981]"></span>
              <p className="font-medium">
                Cam kết môi trường: <strong className="text-[var(--gl-accent)] font-bold">100%</strong> canh tác hữu cơ bền vững Việt Nam
              </p>
                  </div>
        </div>
        </div>

        {/* Transparent backdrop for Mobile Menu click-outside */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-30 bg-transparent lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* ── Mobile Menu Panel ─────────────────────────────────────────── */}
        {isMobileMenuOpen && (
          <div ref={mobileMenuRef} className="lg:hidden border-t border-[var(--gl-border)] bg-[var(--gl-bg-surface)] p-4 space-y-3 animate-slide-down relative z-40">
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
                    role="link"
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium w-full text-left cursor-pointer nav-item-animated min-h-[44px] ${
                      isActive
                        ? "active bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20"
                        : "text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)]"
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
              <div className="flex items-center gap-2 px-4 py-3 bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] rounded-xl text-xs text-[var(--gl-text-secondary)]">
                <MapPin className="h-4 w-4 text-[var(--gl-accent)] shrink-0" />
                <span>
                  Đang chọn vườn: <strong className="text-[var(--gl-accent)]">{matchedStore.name}</strong>
                </span>
              </div>
            )}

            {/* User Profile / Account in Mobile */}
            {currentUser && (
              <div className="pt-2 border-t border-[var(--gl-border)] space-y-1">
                <span className="text-[9px] text-[var(--gl-text-muted)] block uppercase px-4 mb-1 tracking-wider">Tài khoản & Vai trò</span>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (userRole === "admin") handleNavClick("admin-dashboard");
                    else if (userRole === "store") handleNavClick("store-dashboard");
                    else handleNavClick("customer-dashboard");
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)] w-full text-left cursor-pointer transition-all min-h-[44px]"
                >
                  <User className="w-4 h-4 text-[var(--gl-accent)]" />
                  Hồ sơ của tôi
                </button>

                {currentUser.is_seller && userRole === "customer" && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setUserRole("store");
                      setCurrentPage("store-dashboard");
                      setStoreActiveTab("overview");
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)] w-full text-left cursor-pointer transition-all min-h-[44px]"
                  >
                    <Store className="w-4 h-4 text-[var(--gl-accent)]" />
                    Kênh người bán
                  </button>
                )}

                {!currentUser.is_seller && userRole === "customer" && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setCurrentPage("store-profile-setup");
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)] w-full text-left cursor-pointer transition-all min-h-[44px]"
                  >
                    <Store className="w-4 h-4 text-[var(--gl-accent)]" />
                    Đăng ký bán hàng
                  </button>
                )}

                {userRole === "admin" && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleNavClick("admin-dashboard");
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)] w-full text-left cursor-pointer transition-all min-h-[44px]"
                  >
                    <Shield className="w-4 h-4 text-amber-500" />
                    Trang quản trị
                  </button>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--gl-border)]">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--gl-bg-elevated)] text-[var(--gl-text-secondary)] border border-[var(--gl-border)] text-xs font-medium cursor-pointer btn-animated w-full min-h-[44px]"
              >
                {theme === "light" ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-400" />}
                {theme === "light" ? "Tối" : "Sáng"} Giao Diện
              </button>

              {/* Login or Logout */}
              {currentUser ? (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--gl-bg-elevated)] hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--gl-danger)] border border-[var(--gl-border)] hover:border-[var(--gl-danger)]/30 text-xs font-medium cursor-pointer btn-animated w-full min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleNavClick("auth");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer btn-animated w-full min-h-[44px] transition-all ${
                    currentPage === "auth"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-md ring-2 ring-emerald-400/70"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-sm"
                  }`}
                >
                  <User className="w-4 h-4 text-white" />
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Fixed Header Height Spacer to prevent content overlap */}
      <div className="w-full h-[104px] lg:h-[124px] xl:h-[128px] shrink-0 pointer-events-none" aria-hidden="true" />
    </>
  );
};

export const Footer: React.FC<{ setCurrentPage: (p: string) => void }> = ({ setCurrentPage }) => {
  return (
    <footer
      className="text-[var(--gl-text-secondary)] py-14 px-4"
      style={{
        backgroundColor: "var(--gl-bg-footer)",
      }}
    >
      <div className="gl-page-shell grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <span className="font-display font-semibold text-lg text-[var(--gl-text-primary)] tracking-tight">
            Green<span className="text-[var(--gl-accent)] font-extrabold">Life</span>
          </span>
          <p className="mt-4 text-sm leading-relaxed text-[var(--gl-text-muted)]">
            Nền tảng sinh thái tích hợp AI chuyên chẩn đoán, hỗ trợ vườn nhà và kết nối cung ứng sản phẩm organic thân thiện với môi trường Việt Nam.
          </p>
          <div className="mt-5 text-[11px] text-[var(--gl-accent)]/70">
            © 2026 GREENLIFE CORP • BẰNG SÁNG CHẾ VIỆT NAM
          </div>
        </div>

        <div>
          <h4 className="font-display font-semibold text-[var(--gl-text-primary)] text-sm tracking-wider uppercase">Dịch vụ cốt lõi</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <button
                onClick={() => setCurrentPage("ai-diagnosis")}
                className="hover:text-[var(--gl-accent)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--gl-focus-ring)] rounded"
              >
                Bác sĩ cây trồng AI (Gemini 3.5)
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentPage("shop")}
                className="hover:text-[var(--gl-accent)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--gl-focus-ring)] rounded"
              >
                Thương mại điện tử hữu cơ
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentPage("booking")}
                className="hover:text-[var(--gl-accent)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--gl-focus-ring)] rounded"
              >
                Dịch vụ chăm sóc cây
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentPage("blog")}
                className="hover:text-[var(--gl-accent)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--gl-focus-ring)] rounded"
              >
                Truyền thông & Đào tạo xanh
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-[var(--gl-text-primary)] text-sm tracking-wider uppercase">Quy chuẩn cam kết</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <span className="text-[var(--gl-text-muted)] block">Tiêu chuẩn canh tác:</span>
              <span className="text-[var(--gl-text-secondary)] text-xs">Organic Việt Nam & Global GAP</span>
            </li>
            <li>
              <span className="text-[var(--gl-text-muted)] block">Đóng gói bền vững:</span>
              <span className="text-[var(--gl-text-secondary)] text-xs">100% Túi tự phân hủy sinh học</span>
            </li>
            <li>
              <span className="text-[var(--gl-text-muted)] block">Lượng carbon tích lũy:</span>
              <span className="text-[var(--gl-accent)] text-xs font-medium">-750,000 kg CO2 đã trung hòa</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-[var(--gl-text-primary)] text-sm tracking-wider uppercase">Liên hệ bản địa</h4>
          <p className="mt-4 text-sm leading-relaxed text-[var(--gl-text-muted)]">
            Hợp tác xã Công nghệ xanh Hòa Lạc, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội, Việt Nam.
          </p>
          <p className="mt-2 text-sm text-[var(--gl-accent)]">
            hotline: 1800-ECO-GREEN
          </p>
        </div>
      </div>
    </footer>
  );
};
