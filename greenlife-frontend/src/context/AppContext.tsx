import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Product, CartItem, Appointment, DiagnosisLog, EcoStore, BlogPost } from "../types";
import { AuthService } from "../services/authService";
import { PlantService } from "../services/plantService";
import { BookingService } from "../services/bookingService";
import { AIDiagnosisService } from "../services/aiDiagnosisService";
import { ArticleService } from "../services/articleService";
import { BLOG_POSTS, MOCK_STORES } from "../data";

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
    shopName: string;
    shopEmail: string;
    shopPhone: string;
    pickupAddressId: number;
    shippingSettings: {
      greenExpress: boolean;
      hoaToc: boolean;
      spx: boolean;
      ghtk: boolean;
    };
    kycImages: {
      frontImage: string;
      backImage: string;
    };
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
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Event dispatchers
  bookExpert: (appointment: Omit<Appointment, "id" | "status">) => Promise<void>;
  diagnosePlant: (plantName: string, imageUrl: string) => Promise<DiagnosisLog>;
  addNewProduct: (product: Product) => void;
  deleteDiagnosisRecord: (id: string) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  refreshArticles: () => Promise<void>;

  // Admin Navigation settings
  adminActiveTab: "overview" | "stores" | "users" | "products" | "orders" | "blogs";
  setAdminActiveTab: (tab: "overview" | "stores" | "users" | "products" | "orders" | "blogs") => void;

  // Store Navigation settings
  storeActiveTab: "overview" | "orders" | "products" | "settings" | "blogs";
  setStoreActiveTab: (tab: "overview" | "orders" | "products" | "settings" | "blogs") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"customer" | "store" | "admin">("customer");
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<EcoStore[]>(MOCK_STORES);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [diagnosisLogs, setDiagnosisLogs] = useState<DiagnosisLog[]>([]);
  const [currentPage, setCurrentPageState] = useState<string>("home");
  const [selectedProduct, setSelectedProductState] = useState<Product | null>(null);
  const [adminActiveTab, setAdminActiveTab] = useState<"overview" | "stores" | "users" | "products" | "orders" | "blogs">("overview");
  const [storeActiveTab, setStoreActiveTab] = useState<"overview" | "orders" | "products" | "settings" | "blogs">("overview");
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
  const setUserLocation = (loc: { city: string; district: string; address: string }) => {
    setUserLocationState(loc);
    localStorage.setItem("userLocation", JSON.stringify(loc));
  };

  // Persist selected store
  const setSelectedStoreId = (id: string | null) => {
    setSelectedStoreIdState(id);
    if (id) {
      localStorage.setItem("selectedStoreId", id);
    } else {
      localStorage.removeItem("selectedStoreId");
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const updateStoreInfo = (storeId: string, updatedInfo: Partial<EcoStore>) => {
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, ...updatedInfo } : s))
    );
  };

  const addStore = (store: EcoStore) => {
    setStores((prev) => {
      const exists = prev.some((s) => s.id === store.id);
      if (exists) {
        return prev.map((s) => (s.id === store.id ? store : s));
      }
      return [...prev, store];
    });
  };

  // Load initial datasets from service layer
  useEffect(() => {
    const initializeApp = async () => {
      setLoading((prev) => ({ ...prev, auth: true, products: true }));
      try {
        const user = await AuthService.getCurrentUser();
        setCurrentUser(user);
        if (user.role === "admin") {
          setUserRole("admin");
        } else if (user.is_seller) {
          setUserRole("store");
          setCurrentPageState("store-dashboard");
        } else {
          setUserRole(user.role);
        }

        const loadedProducts = await PlantService.getProducts();
        setProducts(loadedProducts);

        const loadedApts = await BookingService.getAppointments();
        setAppointments(loadedApts);

        const loadedDiag = await AIDiagnosisService.getDiagnosisLogs();
        setDiagnosisLogs(loadedDiag);

        const loadedArticles = await ArticleService.getArticles();
        setBlogPosts(loadedArticles);
      } catch (err) {
        console.error("Initialization failed: ", err);
      } finally {
        setLoading((prev) => ({ ...prev, auth: false, products: false }));
      }
    };

    initializeApp();
  }, []);

  // Sync current user's seller store to stores list
  useEffect(() => {
    if (currentUser && currentUser.is_seller) {
      setStores((prev) => {
        const exists = prev.some((s) => s.ownerEmail === currentUser.email);
        if (exists) {
          return prev.map((s) => s.ownerEmail === currentUser.email ? {
            ...s,
            name: currentUser.shop_name || s.name,
            address: currentUser.shop_address || s.address
          } : s);
        }
        
        const myStore: EcoStore = {
          id: `store-${currentUser.id}`,
          name: currentUser.shop_name || "Cửa hàng của tôi",
          ownerName: currentUser.name,
          ownerEmail: currentUser.email,
          rating: 5.0,
          avatar: currentUser.avatar,
          bannerImage: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80",
          address: currentUser.shop_address || "Chưa cập nhật địa chỉ",
          workingHours: "08:00 - 18:00 (Hằng ngày)",
          carbonOffsetKg: 0,
          productsCount: 0,
          verified: true,
          city: "",
          district: "",
          serviceArea: ""
        };
        return [...prev, myStore];
      });
    }
  }, [currentUser]);

  const setCurrentPage = (pageId: string) => {
    setCurrentPageState(pageId);
    setSelectedProductState(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setSelectedProduct = (prod: Product | null) => {
    setSelectedProductState(prod);
    if (prod) {
      setCurrentPageState("product-detail");
    }
  };

  const switchRole = async (role: "customer" | "store" | "admin") => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      if (currentUser) {
        if (role === "store" && !currentUser.is_seller && currentUser.role !== "admin") {
          throw new Error("Tài khoản chưa kích hoạt người bán.");
        }
        setUserRole(role);
        
        // Auto routing according to role dashboards
        if (role === "customer") setCurrentPage("customer-dashboard");
        else if (role === "store") setCurrentPage("store-dashboard");
        else if (role === "admin") setCurrentPage("admin-dashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const sendOTP = async (email: string) => {
    return await AuthService.sendOTP(email);
  };

  const verifyOTP = async (email: string, code: string) => {
    return await AuthService.verifyOTP(email, code);
  };

  const addAddress = async (address: Omit<Parameters<typeof AuthService.addAddress>[1], "userId">) => {
    if (!currentUser) throw new Error("Chưa đăng nhập.");
    return await AuthService.addAddress(currentUser.id, address);
  };

  const registerSeller = async (details: {
    shopName: string;
    shopEmail: string;
    shopPhone: string;
    pickupAddressId: number;
    shippingSettings: {
      greenExpress: boolean;
      hoaToc: boolean;
      spx: boolean;
      ghtk: boolean;
    };
    kycImages: {
      frontImage: string;
      backImage: string;
    };
  }) => {
    if (!currentUser) return;
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      const updatedUser = await AuthService.registerSeller(currentUser.id, details);
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
        name: details.shopName,
        ownerName: currentUser.name,
        ownerEmail: currentUser.email,
        rating: 5.0,
        avatar: currentUser.avatar,
        bannerImage: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80",
        address: mockFullAddressStr,
        workingHours: "08:00 - 18:00 (Hằng ngày)",
        carbonOffsetKg: 0,
        productsCount: 0,
        verified: true,
        city: "",
        district: "",
        serviceArea: ""
      };
      addStore(newStore);
      
      setUserRole("store");
      setCurrentPage("store-dashboard");
    } catch (err) {
      console.error("Lỗi đăng ký bán hàng:", err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const login = async (email: string, password?: string) => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      const user = await AuthService.login(email, password);
      setCurrentUser(user);
      setUserRole(user.role);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      const user = await AuthService.googleLogin(idToken);
      setCurrentUser(user);
      setUserRole(user.role);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const register = async (name: string, email: string, role: "customer" | "store" | "admin", password?: string) => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      await AuthService.register(name, email, role, password);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const registerRequest = async (name: string, email: string, role: "customer" | "store" | "admin", password?: string) => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      return await AuthService.registerRequest(name, email, role, password);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const verifyRegistrationOTP = async (email: string, code: string) => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      const user = await AuthService.verifyRegistrationOTP(email, code);
      setCurrentUser(user);
      setUserRole(user.role);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const logout = async () => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      await AuthService.logout();
      setCurrentUser(null);
      setUserRole("customer");
      setCurrentPage("home");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
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
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const bookExpert = async (appointment: Omit<Appointment, "id" | "status">) => {
    setLoading((prev) => ({ ...prev, bookings: true }));
    try {
      const newApt = await BookingService.bookAppointment(appointment);
      setAppointments((prev) => [newApt, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, bookings: false }));
    }
  };

  const diagnosePlant = async (plantName: string, imageUrl: string) => {
    setLoading((prev) => ({ ...prev, diagnosis: true }));
    try {
      const newDiag = await AIDiagnosisService.diagnosePlantLeaf(plantName, imageUrl);
      setDiagnosisLogs((prev) => [newDiag, ...prev]);
      return newDiag;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, diagnosis: false }));
    }
  };

  const addNewProduct = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
  };

  const deleteDiagnosisRecord = async (id: string) => {
    setLoading((prev) => ({ ...prev, diagnosis: true }));
    try {
      const remaining = await AIDiagnosisService.deleteRecordAndFreeMemory(id);
      setDiagnosisLogs(remaining);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, diagnosis: false }));
    }
  };

  const cancelBooking = async (id: string) => {
    setLoading((prev) => ({ ...prev, bookings: true }));
    try {
      const remaining = await BookingService.cancelAppointment(id);
      setAppointments(remaining);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, bookings: false }));
    }
  };

  const refreshArticles = async () => {
    try {
      const loadedArticles = await ArticleService.getArticles();
      setBlogPosts(loadedArticles);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppContext.Provider
      value={{
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
        bookExpert,
        diagnosePlant,
        addNewProduct,
        deleteDiagnosisRecord,
        cancelBooking,
        refreshArticles,
        adminActiveTab,
        setAdminActiveTab,
        storeActiveTab,
        setStoreActiveTab
      }}
    >
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
