import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { User, Product, CartItem, Appointment, DiagnosisLog, EcoStore, BlogPost, NotificationItem } from "../types";
import { AuthService } from "../services/authService";
import { PlantService } from "../services/plantService";
import { BookingService } from "../services/bookingService";
import { AIDiagnosisService } from "../services/aiDiagnosisService";
import { ArticleService } from "../services/articleService";
import { NotificationService } from "../services/notificationService";
import { CartService } from "../services/cartService";
import { AddressService } from "../services/addressService";
import { OrderService } from "../services/orderService";
import { WishlistService } from "../services/wishlistService";
import { ReviewService } from "../services/reviewService";
import { MOCK_STORES } from "../data";
import { logger } from "../utils/logger";

interface AppContextType {
  currentUser: User | null;
  userRole: "customer" | "store" | "admin";
  products: Product[];
  stores: EcoStore[];
  blogPosts: BlogPost[];
  cart: CartItem[];
  appointments: Appointment[];
  diagnosisLogs: DiagnosisLog[];
  currentPage: string;
  selectedProduct: Product | null;
  loading: Record<string, boolean>;

  // Theme and Location settings
  theme: "light" | "dark";
  toggleTheme: () => void;
  userLocation: { city: string; district: string; address: string };
  setUserLocation: (loc: { city: string; district: string; address: string }) => void;
  selectedStoreId: string | null;
  setSelectedStoreId: (id: string | null) => void;
  updateStoreInfo: (storeId: string, updatedInfo: Partial<EcoStore>) => void;
  addStore: (store: EcoStore) => void;

  // Handlers
  setCurrentPage: (page: string) => void;
  setSelectedProduct: (product: Product | null) => void;
  switchRole: (role: "customer" | "store" | "admin") => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (name: string, email: string, role: "customer" | "store" | "admin", password?: string) => Promise<void>;
  registerRequest: (name: string, email: string, role: "customer" | "store" | "admin", password?: string) => Promise<{ success: boolean; message: string }>;
  verifyRegistrationOTP: (email: string, code: string) => Promise<void>;
  registerSeller: (details: {
    name: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    description?: string;
    logoUrl?: string;
    verificationDocument?: string;
    shopEmail: string;
    pickupAddressId: number;
  }) => Promise<void>;
  sendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  addAddress: (address: {
    fullname: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    detailAddress: string;
    isDefault: boolean;
    isPickup: boolean;
    type: "home" | "office";
  }) => Promise<{ success: boolean; addressId: number; address: any }>;
  logout: () => Promise<void>;
  
  // Shopping Cart handlers
  addToCart: (product: Product, quantity?: number, event?: React.MouseEvent) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  loadCart: () => Promise<void>;
  removeCartItem: (itemId: number) => Promise<void>;
  checkoutCart: (payload: any) => Promise<any>;
  toggleWishlist: (productId: number) => Promise<void>;

  // Event dispatchers
  bookExpert: (appointment: Omit<Appointment, "id" | "status">) => Promise<void>;
  diagnosePlant: (plantName: string, imageUrl: string) => Promise<DiagnosisLog>;
  addNewProduct: (product: Product) => void;
  deleteDiagnosisRecord: (id: string) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  refreshArticles: () => Promise<void>;
  loadArticles: (keyword?: string, category?: string) => Promise<void>;

  // Admin Navigation settings
  adminActiveTab: "overview" | "stores" | "users" | "products" | "orders" | "blogs" | "reviews";
  setAdminActiveTab: (tab: "overview" | "stores" | "users" | "products" | "orders" | "blogs" | "reviews") => void;

  // Store Navigation settings
  storeActiveTab: "overview" | "orders" | "products" | "settings" | "blogs" | "reviews";
  setStoreActiveTab: (tab: "overview" | "orders" | "products" | "settings" | "blogs" | "reviews") => void;
  loadProducts: (search?: string, category?: string, signal?: AbortSignal) => Promise<void>;

  // Review CRUD actions
  createReview: (payload: { plantId?: number | null; storeId?: number | null; rating: number; comment: string }) => Promise<any>;
  updateReview: (id: number, payload: { rating: number; comment: string }) => Promise<any>;
  deleteReview: (id: number) => Promise<void>;
  moderateReview: (id: number, status: "VISIBLE" | "HIDDEN") => Promise<any>;

  // Notifications
  notifications: NotificationItem[];
  unreadCount: number;
  loadNotifications: (page?: number, size?: number, signal?: AbortSignal) => Promise<void>;
  loadUnreadCount: (signal?: AbortSignal) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"customer" | "store" | "admin">("customer");
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<EcoStore[]>(MOCK_STORES);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [diagnosisLogs, setDiagnosisLogs] = useState<DiagnosisLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [currentPage, setCurrentPageState] = useState<string>("home");
  const [selectedProduct, setSelectedProductState] = useState<Product | null>(null);
  const [adminActiveTab, setAdminActiveTab] = useState<"overview" | "stores" | "users" | "products" | "orders" | "blogs" | "reviews">("overview");
  const [storeActiveTab, setStoreActiveTab] = useState<"overview" | "orders" | "products" | "settings" | "blogs" | "reviews">("overview");
  const [loading, setLoading] = useState<Record<string, boolean>>({
    auth: false,
    products: false,
    bookings: false,
    diagnosis: false
  });

  // Theme State (default to light mode)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  // User Location State (Default to Đà Nẵng, Hải Châu, 100 Lê Lợi)
  const [userLocation, setUserLocationState] = useState<{ city: string; district: string; address: string }>(() => {
    const saved = localStorage.getItem("userLocation");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { city: "Đà Nẵng", district: "Hải Châu", address: "100 Lê Lợi, Hải Châu, Đà Nẵng" };
  });

  // Selected Store State (default to Đà Nẵng store 3)
  const [selectedStoreId, setSelectedStoreIdState] = useState<string | null>(() => {
    return localStorage.getItem("selectedStoreId") || "store-3";
  });

  // Theme synchronization effect
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Persist location
  const setUserLocation = useCallback((loc: { city: string; district: string; address: string }) => {
    setUserLocationState(loc);
    localStorage.setItem("userLocation", JSON.stringify(loc));
  }, []);

  // Persist selected store
  const setSelectedStoreId = useCallback((id: string | null) => {
    setSelectedStoreIdState(id);
    if (id) {
      localStorage.setItem("selectedStoreId", id);
    } else {
      localStorage.removeItem("selectedStoreId");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const updateStoreInfo = useCallback((storeId: string, updatedInfo: Partial<EcoStore>) => {
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, ...updatedInfo } : s))
    );
  }, []);

  const addStore = useCallback((store: EcoStore) => {
    setStores((prev) => {
      const exists = prev.some((s) => s.id === store.id);
      if (exists) {
        return prev.map((s) => (s.id === store.id ? store : s));
      }
      return [...prev, store];
    });
  }, []);

  const loadProducts = useCallback(async (search?: string, category?: string, signal?: AbortSignal) => {
    setLoading((prev) => ({ ...prev, products: true }));
    try {
      const loadedProducts = await PlantService.getProducts(search, category, signal);
      setProducts(loadedProducts);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        logger.error("Lỗi tải sản phẩm:", err);
      }
    } finally {
      setLoading((prev) => ({ ...prev, products: false }));
    }
  }, []);

  const loadArticles = useCallback(async (keyword?: string, category?: string) => {
    try {
      const res = await ArticleService.getArticles(keyword, category, 0, 100);
      setBlogPosts(res.content);
    } catch (err) {
      logger.error("Lỗi khi tải cẩm nang:", err);
    }
  }, []);

  const loadNotifications = useCallback(async (page = 0, size = 10, signal?: AbortSignal) => {
    if (!currentUser) return;
    try {
      const res = await NotificationService.getNotifications(page, size, signal);
      setNotifications(res.content);
    } catch (err) {
      logger.error("Lỗi tải thông báo:", err);
    }
  }, [currentUser?.id]);

  const loadUnreadCount = useCallback(async (signal?: AbortSignal) => {
    if (!currentUser) return;
    try {
      const count = await NotificationService.getUnreadCount(signal);
      setUnreadCount(count);
    } catch (err) {
      logger.error("Lỗi tải số lượng thông báo chưa đọc:", err);
    }
  }, [currentUser?.id]);

  const markAsRead = useCallback(async (id: number) => {
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await NotificationService.markAsRead(id);
    } catch (err) {
      logger.error(err);
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      toast.error("Không thể đánh dấu thông báo đã đọc, vui lòng thử lại.");
    }
  }, [notifications, unreadCount]);

  const markAllAsRead = useCallback(async () => {
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await NotificationService.markAllAsRead();
    } catch (err) {
      logger.error(err);
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      toast.error("Không thể đánh dấu tất cả đã đọc, vui lòng thử lại.");
    }
  }, [notifications, unreadCount]);

  const deleteNotification = useCallback(async (id: number) => {
    const previousNotifications = [...notifications];
    const target = notifications.find(n => n.id === id);
    const previousUnreadCount = unreadCount;

    setNotifications(prev => prev.filter(n => n.id !== id));
    if (target && !target.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await NotificationService.deleteNotification(id);
    } catch (err) {
      logger.error(err);
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      toast.error("Không thể xóa thông báo, vui lòng thử lại.");
    }
  }, [notifications, unreadCount]);

  const unreadCountRef = useRef(unreadCount);
  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setCart([]);
      return;
    }

    loadUnreadCount();
    loadNotifications(0, 10);

    if (userRole === "customer") {
      loadCart();

      const syncWishlist = async () => {
        try {
          const wishlistItems = await WishlistService.getWishlist(0, 100);
          const savedIds = wishlistItems.map((item: any) => String(item.id));
          setCurrentUser((prevUser) => {
            if (!prevUser) return null;
            const currentIds = prevUser.savedProductIds || [];
            const hasChanged = currentIds.length !== savedIds.length ||
              !savedIds.every((id) => currentIds.includes(id));
            if (!hasChanged) return prevUser;
            return {
              ...prevUser,
              savedProductIds: savedIds
            };
          });
        } catch (err) {
          logger.warn("Lỗi đồng bộ danh sách yêu thích:", err);
        }
      };
      syncWishlist();
    } else {
      setCart([]);
    }

    let intervalId: any;

    const poll = async () => {
      if (document.hidden) return;
      try {
        const currentCount = await NotificationService.getUnreadCount();
        if (currentCount !== unreadCountRef.current) {
          setUnreadCount(currentCount);
          const res = await NotificationService.getNotifications(0, 10);
          setNotifications(res.content);
        }
      } catch (err) {
        logger.warn("Lỗi polling thông báo:", err);
      }
    };

    const startPolling = () => {
      clearInterval(intervalId);
      intervalId = setInterval(poll, 30000);
    };

    const stopPolling = () => {
      clearInterval(intervalId);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        poll();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser?.id, userRole]);

  // Listen to global unrecoverable auth failures
  useEffect(() => {
    const handleUnauthorized = () => {
      logger.warn("Received unauthorized event. Cleaning up auth states.");
      localStorage.removeItem("greenlife_active_role");
      setCurrentUser(null);
      setUserRole("customer");
      setCurrentPageState("auth");
    };

    window.addEventListener("auth-unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth-unauthorized", handleUnauthorized);
    };
  }, []);

  // Load initial datasets from service layer
  useEffect(() => {
    const initializeApp = async () => {
      setLoading((prev) => ({ ...prev, auth: true, products: true }));
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          const savedActiveRole = localStorage.getItem("greenlife_active_role") as "customer" | "store" | "admin";
          if (savedActiveRole && (savedActiveRole === "customer" || savedActiveRole === "admin" || (savedActiveRole === "store" && user.is_seller))) {
            setUserRole(savedActiveRole);
            if (savedActiveRole === "store") {
              setCurrentPageState("store-dashboard");
            } else if (savedActiveRole === "admin") {
              setCurrentPageState("admin-dashboard");
            }
          } else {
            if (user.role === "admin") {
              setUserRole("admin");
            } else if (user.is_seller) {
              setUserRole("store");
              setCurrentPageState("store-dashboard");
            } else {
              setUserRole(user.role);
            }
          }
        } else {
          setCurrentUser(null);
          setUserRole("customer");
        }

        await loadProducts();

        // Bookings are fetched on-demand locally in views, not preloaded globally
        setAppointments([]);

        setDiagnosisLogs([]);

        // Phase 4-J6: Articles/blogs are deferred from startup to reduce DB pressure.
        // They were previously loaded unconditionally during app init alongside products
        // and /api/auth/me \u2014 creating a 3-request burst on startup even before login.
        // loadArticles() is called lazily when the user navigates to blog-related pages.
        // setBlogPosts([]) keeps the initial state clean.
      } catch (err) {
        logger.error("Initialization failed: ", err);
        setCurrentUser(null);
        setUserRole("customer");
      } finally {
        setLoading((prev) => ({ ...prev, auth: false, products: false }));
      }
    };

    initializeApp();
  }, []);

  // Background token refresh scheduler
  useEffect(() => {
    if (!currentUser) return;

    // Refresh token every 10 minutes (600,000 ms)
    const interval = setInterval(async () => {
      try {
        await AuthService.refreshToken();
      } catch (err) {
        logger.warn("Background token refresh failed:", err);
        logout();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Sync current user's seller store - Removed for Phase 2 restricted scope lazy loading

  // History synchronization listener for back/forward navigation
  useEffect(() => {
    // Set initial page history state if not already set
    if (!window.history.state || !window.history.state.page) {
      window.history.replaceState({ page: currentPage }, "", "");
    }

    const handlePopState = (event: PopStateEvent) => {
      const page = event.state?.page;
      if (page) {
        setCurrentPageState(page);
        if (page !== "product-detail") {
          setSelectedProductState(null);
        }
      } else {
        setCurrentPageState("home");
        setSelectedProductState(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentPage]);

  const setCurrentPage = useCallback((pageId: string) => {
    if (pageId && (!window.history.state || window.history.state.page !== pageId)) {
      window.history.pushState({ page: pageId }, "", "");
    }
    setCurrentPageState(pageId);
    setSelectedProductState(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const setSelectedProduct = useCallback((prod: Product | null) => {
    setSelectedProductState(prod);
    if (prod) {
      if (!window.history.state || window.history.state.page !== "product-detail") {
        window.history.pushState({ page: "product-detail" }, "", "");
      }
      setCurrentPageState("product-detail");
    }
  }, []);

  const switchRole = useCallback(async (role: "customer" | "store" | "admin") => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      if (currentUser) {
        if (role === "store" && !currentUser.is_seller && currentUser.role !== "admin") {
          throw new Error("Tài khoản chưa kích hoạt người bán.");
        }
        setUserRole(role);
        localStorage.setItem("greenlife_active_role", role);
        
        // Auto routing according to role dashboards
        if (role === "customer") setCurrentPage("customer-dashboard");
        else if (role === "store") setCurrentPage("store-dashboard");
        else if (role === "admin") setCurrentPage("admin-dashboard");
      }
    } catch (err) {
      logger.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  }, [currentUser, setCurrentPage]);

  const sendOTP = useCallback(async (email: string) => {
    return await AuthService.sendOTP(email);
  }, []);

  const verifyOTP = useCallback(async (email: string, code: string) => {
    return await AuthService.verifyOTP(email, code);
  }, []);

  const addAddress = useCallback(async (address: Omit<Parameters<typeof AuthService.addAddress>[1], "userId">) => {
    if (!currentUser) throw new Error("Chưa đăng nhập.");
    const created = await AddressService.createAddress(address as any);
    return { success: true, addressId: created.address_id!, address: created };
  }, [currentUser]);

  const registerSeller = useCallback(async (details: {
    name: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    description?: string;
    logoUrl?: string;
    verificationDocument?: string;
    shopEmail: string;
    pickupAddressId: number;
  }) => {
    if (!currentUser) return;
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      const updatedUser = await AuthService.registerSeller(currentUser.id, {
        name: details.name,
        phone: details.phone,
        city: details.city,
        district: details.district,
        address: details.address,
        description: details.description,
        logoUrl: details.logoUrl,
        verificationDocument: details.verificationDocument
      });
      setCurrentUser(updatedUser);
      
      let mockFullAddressStr = "Chưa cập nhật địa chỉ lấy hàng cụ thể";
      const storedAddrs = localStorage.getItem(`mock_addresses_${currentUser.id}`);
      if (storedAddrs) {
        const list = JSON.parse(storedAddrs);
        const matched = list.find((a: any) => String(a.address_id) === String(details.pickupAddressId));
        if (matched) {
          mockFullAddressStr = `${matched.detail_address}, ${matched.ward}, ${matched.district}, ${matched.province}`;
        }
      }

      const newStore: EcoStore = {
        id: `store-${currentUser.id}`,
        name: details.name,
        ownerName: currentUser.name,
        ownerEmail: details.shopEmail || currentUser.email,
        rating: 5.0,
        avatar: details.logoUrl || currentUser.avatar,
        bannerImage: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80",
        address: mockFullAddressStr,
        workingHours: "08:00 - 18:00 (Hằng ngày)",
        carbonOffsetKg: 0,
        productsCount: 0,
        verified: false,
        city: details.city,
        district: details.district,
        serviceArea: ""
      };
      addStore(newStore);
      toast.success("Gửi hồ sơ đăng ký bán hàng thành công! Đang chờ Admin duyệt.");
    } catch (err) {
      logger.error("Lỗi đăng ký bán hàng:", err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  }, [currentUser, addStore]);

  const login = useCallback(async (email: string, password?: string) => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      const user = await AuthService.login(email, password);
      setCurrentUser(user);
      localStorage.removeItem("greenlife_active_role");
      if (user.role === "admin") {
        setUserRole("admin");
      } else if (user.is_seller) {
        setUserRole("store");
        setCurrentPageState("store-dashboard");
      } else {
        setUserRole(user.role);
      }
    } catch (err) {
      logger.error(err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      const user = await AuthService.googleLogin(idToken);
      setCurrentUser(user);
      localStorage.removeItem("greenlife_active_role");
      if (user.role === "admin") {
        setUserRole("admin");
      } else if (user.is_seller) {
        setUserRole("store");
        setCurrentPageState("store-dashboard");
      } else {
        setUserRole(user.role);
      }
    } catch (err) {
      logger.error(err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  }, []);

  const register = useCallback(async (name: string, email: string, role: "customer" | "store" | "admin", password?: string) => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      await AuthService.registerRequest(name, email, role, password);
    } catch (err) {
      logger.error(err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  }, []);

  const registerRequest = useCallback(async (name: string, email: string, role: "customer" | "store" | "admin", password?: string) => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      return await AuthService.registerRequest(name, email, role, password);
    } catch (err) {
      logger.error(err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  }, []);

  const verifyRegistrationOTP = useCallback(async (email: string, code: string) => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      await AuthService.verifyRegistrationOTP(email, code);
    } catch (err) {
      logger.error(err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      await AuthService.logout();
      const google = (window as any).google;
      if (google && google.accounts && google.accounts.id) {
        try {
          google.accounts.id.disableAutoSelect();
        } catch (e) {
          logger.warn("Could not disable Google auto-select:", e);
        }
      }
    } catch (err) {
      logger.error(err);
    } finally {
      localStorage.removeItem("greenlife_active_role");
      setCurrentUser(null);
      setUserRole("customer");
      setCurrentPage("home");
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  }, [setCurrentPage]);

  const loadCart = useCallback(async () => {
    if (!AuthService.getAccessToken()) {
      setCart([]);
      return;
    }
    try {
      const res = await CartService.getCart();
      setCart(res.items);
    } catch (err) {
      logger.error("Lỗi khi tải giỏ hàng:", err);
    }
  }, []);

  const addToCart = useCallback(async (product: Product, quantity = 1, event?: React.MouseEvent) => {
    if (!currentUser) {
      setCurrentPage("auth");
      toast.error("Vui lòng đăng nhập để sử dụng giỏ hàng.");
      return;
    }

    const existing = cart.find((item) => item.product.id === product.id);
    const targetQty = (existing ? existing.quantity : 0) + quantity;
    if (product.stock !== undefined && targetQty > product.stock) {
      toast.error(`Rất tiếc, sản phẩm này chỉ còn ${product.stock} sản phẩm trong kho.`);
      return;
    }

    // Phase 4-J7: Fly-to-cart animation.
    // If the caller provides the click MouseEvent, we create a small CSS-animated
    // dot that flies from the click point toward the cart icon in the header.
    // Animation is fire-and-forget — failure never blocks the actual cart add.
    if (event) {
      try {
        const cartIconEl = document.querySelector('[aria-label="Giỏ hàng"]');
        const startX = event.clientX;
        const startY = event.clientY;
        let endX = startX;
        let endY = 80; // fallback: top-right area
        if (cartIconEl) {
          const rect = cartIconEl.getBoundingClientRect();
          endX = rect.left + rect.width / 2;
          endY = rect.top + rect.height / 2;
        }
        const dx = endX - startX;
        const dy = endY - startY;

        const dot = document.createElement("div");
        dot.className = "fly-to-cart-dot";
        dot.style.left = `${startX - 9}px`;
        dot.style.top = `${startY - 9}px`;
        // Custom properties drive the final translate direction
        dot.style.setProperty("--fly-dx", `${dx}px`);
        dot.style.setProperty("--fly-dy", `${dy}px`);
        document.body.appendChild(dot);
        setTimeout(() => {
          if (dot.parentNode) dot.parentNode.removeChild(dot);
        }, 700);
      } catch (_) {
        // Animation errors must never surface to the user
      }
    }

    const originalCart = [...cart];
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    try {
      await CartService.addToCart(Number(product.id), quantity);
      await loadCart();
      toast.success("Đã thêm vào giỏ hàng! 🌿");
    } catch (err) {
      logger.error("Lỗi khi thêm sản phẩm:", err);
      setCart(originalCart);
      toast.error("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
    }
  }, [currentUser, cart, loadCart, setCurrentPage]);

  const updateCartQuantity = useCallback(async (productId: string, delta: number) => {
    const originalCart = [...cart];
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;

    if (delta > 0 && item.product.stock !== undefined && newQty > item.product.stock) {
      toast.error(`Rất tiếc, sản phẩm này chỉ còn ${item.product.stock} sản phẩm trong kho.`);
      return;
    }

    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      try {
        if (item.id) {
          await CartService.removeCartItem(item.id);
        } else {
          await loadCart();
        }
      } catch (err) {
        logger.error("Lỗi khi xóa sản phẩm:", err);
        setCart(originalCart);
        toast.error("Không thể cập nhật số lượng. Vui lòng thử lại.");
      }
    } else {
      setCart((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity: newQty } : i))
      );
      try {
        if (item.id) {
          await CartService.updateCartItem(item.id, newQty);
        } else {
          await loadCart();
        }
      } catch (err) {
        logger.error("Lỗi khi cập nhật số lượng:", err);
        setCart(originalCart);
        toast.error("Không thể cập nhật số lượng. Vui lòng thử lại.");
      }
    }
  }, [cart, loadCart]);

  const removeFromCart = useCallback(async (productId: string) => {
    const originalCart = [...cart];
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    setCart((prev) => prev.filter((i) => i.product.id !== productId));

    try {
      if (item.id) {
        await CartService.removeCartItem(item.id);
      } else {
        await loadCart();
      }
    } catch (err) {
      logger.error("Lỗi khi xóa sản phẩm:", err);
      setCart(originalCart);
      toast.error("Không thể xóa sản phẩm. Vui lòng thử lại.");
    }
  }, [cart, loadCart]);

  const removeCartItem = useCallback(async (itemId: number) => {
    const originalCart = [...cart];
    setCart((prev) => prev.filter((i) => i.id !== itemId));

    try {
      await CartService.removeCartItem(itemId);
    } catch (err) {
      logger.error("Lỗi khi xóa sản phẩm:", err);
      setCart(originalCart);
      toast.error("Không thể xóa sản phẩm. Vui lòng thử lại.");
    }
  }, [cart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const checkoutCart = useCallback(async (payload: any) => {
    const orders = await OrderService.checkoutCart(payload);
    clearCart();
    return orders;
  }, [clearCart]);

  const toggleWishlist = useCallback(async (productId: number) => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để lưu sản phẩm yêu thích.");
      return;
    }
    const isLiked = currentUser.savedProductIds?.includes(String(productId));
    try {
      if (isLiked) {
        await WishlistService.removeWishlist(productId);
        setCurrentUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            savedProductIds: (prev.savedProductIds || []).filter(id => id !== String(productId))
          };
        });
      } else {
        await WishlistService.addWishlist(productId);
        setCurrentUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            savedProductIds: [...(prev.savedProductIds || []), String(productId)]
          };
        });
      }
    } catch (err: any) {
      toast.error("Lỗi cập nhật danh sách yêu thích: " + err.message);
    }
  }, [currentUser]);

  const bookExpert = useCallback(async (appointment: Omit<Appointment, "id" | "status">) => {
    // Handled locally within component-level services
  }, []);

  const diagnosePlant = useCallback(async (plantName: string, imageUrl: string) => {
    setLoading((prev) => ({ ...prev, diagnosis: true }));
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const newDiag = await AIDiagnosisService.diagnosePlantLeaf(blob);
      setDiagnosisLogs((prev) => [newDiag, ...prev]);
      return newDiag;
    } catch (err) {
      logger.error(err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, diagnosis: false }));
    }
  }, []);

  const addNewProduct = useCallback((product: Product) => {
    setProducts((prev) => [product, ...prev]);
  }, []);

  const deleteDiagnosisRecord = useCallback(async (id: string) => {
    return Promise.resolve();
  }, []);

  const cancelBooking = useCallback(async (id: string) => {
    // Handled locally within component-level services
  }, []);

  const refreshArticles = useCallback(async () => {
    try {
      const loadedArticles = await ArticleService.getArticles();
      setBlogPosts(loadedArticles.content);
    } catch (err) {
      logger.error(err);
    }
  }, []);

  const createReview = useCallback(async (payload: { plantId?: number | null; storeId?: number | null; rating: number; comment: string }) => {
    return await ReviewService.createReview(payload);
  }, []);

  const updateReview = useCallback(async (id: number, payload: { rating: number; comment: string }) => {
    return await ReviewService.updateReview(id, payload);
  }, []);

  const deleteReview = useCallback(async (id: number) => {
    await ReviewService.deleteReview(id);
  }, []);

  const moderateReview = useCallback(async (id: number, status: "VISIBLE" | "HIDDEN") => {
    return await ReviewService.moderateReview(id, status);
  }, []);

  const contextValue = useMemo(
    () => ({
      currentUser,
      userRole,
      products,
      stores,
      blogPosts,
      cart,
      appointments,
      diagnosisLogs,
      currentPage,
      selectedProduct,
      loading,
      theme,
      toggleTheme,
      userLocation,
      setUserLocation,
      selectedStoreId,
      setSelectedStoreId,
      updateStoreInfo,
      addStore,
      setCurrentPage,
      setSelectedProduct,
      switchRole,
      login,
      loginWithGoogle,
      register,
      registerRequest,
      verifyRegistrationOTP,
      registerSeller,
      sendOTP,
      verifyOTP,
      addAddress,
      logout,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      loadCart,
      removeCartItem,
      checkoutCart,
      toggleWishlist,
      bookExpert,
      diagnosePlant,
      addNewProduct,
      deleteDiagnosisRecord,
      cancelBooking,
      refreshArticles,
      adminActiveTab,
      setAdminActiveTab,
      storeActiveTab,
      setStoreActiveTab,
      loadProducts,
      loadArticles,
      notifications,
      unreadCount,
      loadNotifications,
      loadUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      createReview,
      updateReview,
      deleteReview,
      moderateReview
    }),
    [
      currentUser,
      userRole,
      products,
      stores,
      blogPosts,
      cart,
      appointments,
      diagnosisLogs,
      currentPage,
      selectedProduct,
      loading,
      theme,
      toggleTheme,
      userLocation,
      setUserLocation,
      selectedStoreId,
      setSelectedStoreId,
      updateStoreInfo,
      addStore,
      setCurrentPage,
      setSelectedProduct,
      switchRole,
      login,
      loginWithGoogle,
      register,
      registerRequest,
      verifyRegistrationOTP,
      registerSeller,
      sendOTP,
      verifyOTP,
      addAddress,
      logout,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      loadCart,
      removeCartItem,
      checkoutCart,
      toggleWishlist,
      bookExpert,
      diagnosePlant,
      addNewProduct,
      deleteDiagnosisRecord,
      cancelBooking,
      refreshArticles,
      adminActiveTab,
      setAdminActiveTab,
      storeActiveTab,
      setStoreActiveTab,
      loadProducts,
      loadArticles,
      notifications,
      unreadCount,
      loadNotifications,
      loadUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      createReview,
      updateReview,
      deleteReview,
      moderateReview
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
export default AppContext;
