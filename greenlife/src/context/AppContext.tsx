import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Product, CartItem, Appointment, DiagnosisLog, EcoStore, BlogPost } from "../types";
import { AuthService } from "../services/authService";
import { PlantService } from "../services/plantService";
import { BookingService } from "../services/bookingService";
import { AIDiagnosisService } from "../services/aiDiagnosisService";
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

  // Handlers
  setCurrentPage: (page: string) => void;
  setSelectedProduct: (product: Product | null) => void;
  switchRole: (role: "customer" | "store" | "admin") => Promise<void>;
  login: (email: string) => Promise<void>;
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
  const [loading, setLoading] = useState<Record<string, boolean>>({
    auth: false,
    products: false,
    bookings: false,
    diagnosis: false
  });

  // Load initial datasets from service layer
  useEffect(() => {
    const initializeApp = async () => {
      setLoading((prev) => ({ ...prev, auth: true, products: true }));
      try {
        const user = await AuthService.getCurrentUser();
        setCurrentUser(user);
        setUserRole(user.role);

        const loadedProducts = await PlantService.getProducts();
        setProducts(loadedProducts);

        const loadedApts = await BookingService.getAppointments();
        setAppointments(loadedApts);

        const loadedDiag = await AIDiagnosisService.getDiagnosisLogs();
        setDiagnosisLogs(loadedDiag);
      } catch (err) {
        console.error("Initialization failed: ", err);
      } finally {
        setLoading((prev) => ({ ...prev, auth: false, products: false }));
      }
    };

    initializeApp();
  }, []);

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
      const user = await AuthService.switchRoleAndUser(role);
      setCurrentUser(user);
      setUserRole(role);
      
      // Auto routing according to role dashboards
      if (role === "customer") setCurrentPage("customer-dashboard");
      else if (role === "store") setCurrentPage("store-dashboard");
      else if (role === "admin") setCurrentPage("admin-dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const login = async (email: string) => {
    setLoading((prev) => ({ ...prev, auth: true }));
    try {
      const user = await AuthService.login(email);
      setCurrentUser(user);
      setUserRole(user.role);
    } catch (err) {
      console.error(err);
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
        setCurrentPage,
        setSelectedProduct,
        switchRole,
        login,
        logout,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        bookExpert,
        diagnosePlant,
        addNewProduct,
        deleteDiagnosisRecord,
        cancelBooking
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
