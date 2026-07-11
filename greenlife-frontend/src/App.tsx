import React, { useState, Suspense, lazy } from "react";
import { Navigation, Footer } from "./components/common/Navigation";
import { HomeView } from "./components/views/HomeView";
import { ExpertDirectoryView } from "./components/views/ExpertDirectoryView";
import { BlogView } from "./components/views/BlogView";
import { AuthView } from "./components/views/AuthView";
import { DashboardSkeleton } from "./components/common/Skeleton";

// Lazy-loaded views
const ShopView = lazy(() => import("./components/views/ShopView").then(m => ({ default: m.ShopView })));
const ProductDetailView = lazy(() => import("./components/views/ProductDetailView").then(m => ({ default: m.ProductDetailView })));
const AIDiagnosisView = lazy(() => import("./components/views/AIDiagnosisView").then(m => ({ default: m.AIDiagnosisView })));
const CustomerDashboardView = lazy(() => import("./components/views/CustomerDashboardView").then(m => ({ default: m.CustomerDashboardView })));
const AdminDashboardView = lazy(() => import("./components/views/AdminDashboardView").then(m => ({ default: m.AdminDashboardView })));
const StoreProfileSetupView = lazy(() => import("./components/views/StoreProfileSetupView").then(m => ({ default: m.StoreProfileSetupView })));

import { Product, DiagnosisLog } from "./types";
import { useAppContext } from "./context/AppContext";
import { useCart } from "./hooks/useCart";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { StoreDashboardGuard } from "./components/common/StoreDashboardGuard";
import { CartDrawer } from "./components/common/CartDrawer";
import { Chatbot } from "./components/ui/Chatbot";
import { Toaster } from "react-hot-toast";
import { PaymentStatusView } from "./components/views/PaymentStatusView";

export default function App() {
  const {
    currentPage,
    setCurrentPage,
    userRole,
    switchRole,
    products,
    selectedProduct,
    setSelectedProduct,
    appointments,
    diagnosisLogs,
    addNewProduct,
    bookExpert,
    diagnosePlant,
    currentUser
  } = useAppContext();

  const {
    items: cart,
    cartTotal,
    cartItemCount,
    co2OffsetKg,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  // Local Drawer Toggle
  const [cartOpen, setCartOpen] = useState(false);
  const [shopSearch, setShopSearch] = useState("");

  // Simple path routing hook/effect
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path === "/payment/success") {
      setCurrentPage("payment-success");
    } else if (path === "/payment/cancel") {
      setCurrentPage("payment-cancel");
    }
  }, [setCurrentPage]);

  // Cart Handlers bridging UI events
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    addToCart(product, quantity);
  };


  const handleInspectSelectedProduct = (prod: Product) => {
    setSelectedProduct(prod);
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Prime Header & Navigation */}
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        cartCount={cartItemCount}
        userRole={userRole}
        setUserRole={switchRole}
        openCart={() => setCartOpen(true)}
      />

      {/* Main viewport Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <Suspense fallback={<DashboardSkeleton />}>
          {/* Swapping Active Component View according to state */}
          {(() => {
            if (currentPage === "product-detail" && selectedProduct) {
              return (
                <ProductDetailView
                  product={selectedProduct}
                  onBackToShop={() => setCurrentPage("shop")}
                  onAddToCart={handleAddToCart}
                />
              );
            }

            switch (currentPage) {
              case "home":
                return (
                  <HomeView
                    products={products}
                    setCurrentPage={setCurrentPage}
                    onSelectProduct={handleInspectSelectedProduct}
                    onSearch={(query) => {
                      setShopSearch(query);
                      
                      const q = query.toLowerCase().trim();
                      const hasProductMatch = products.some(
                        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
                      );
                      const isArticleSearch = q.includes("bệnh") || q.includes("nhện") || q.includes("rệp") || q.includes("sâu") || q.includes("bí quyết") || q.includes("chu trình") || q.includes("đất") || q.includes("lá") || q.includes("cẩm nang") || q.includes("vườn rau") || q.includes("chăm sóc");
                      
                      if (isArticleSearch && !hasProductMatch) {
                        setCurrentPage("blog");
                      } else {
                        setCurrentPage("shop");
                      }
                    }}
                  />
                );
              case "shop":
                return (
                  <ShopView
                    products={products}
                    onSelectProduct={handleInspectSelectedProduct}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                    initialSearch={shopSearch}
                  />
                );
              case "ai-diagnosis":
                return (
                  <AIDiagnosisView
                    products={products}
                    onSelectProduct={handleInspectSelectedProduct}
                    diagnosisLogs={diagnosisLogs}
                    onAddDiagnosisLog={(log: DiagnosisLog) => {
                      // Backwards compatible with original inline adders
                      diagnosePlant(log.plantName, log.imageUrl);
                    }}
                  />
                );
              case "booking":
                return (
                  <ExpertDirectoryView />
                );
              case "blog":
                return <BlogView initialSearch={shopSearch} />;
              case "auth":
                return (
                  <AuthView
                    userRole={userRole}
                    setUserRole={switchRole}
                    setCurrentPage={setCurrentPage}
                  />
                );
              case "customer-dashboard":
                return (
                  <ProtectedRoute allowedRoles={["customer", "store", "admin"]} onPageRedirect={setCurrentPage}>
                    <CustomerDashboardView
                      appointments={appointments}
                      diagnosisLogs={diagnosisLogs}
                      setCurrentPage={setCurrentPage}
                    />
                  </ProtectedRoute>
                );
              case "store-dashboard":
                return (
                  <ProtectedRoute allowedRoles={["store", "admin"]} onPageRedirect={setCurrentPage}>
                    <StoreDashboardGuard
                      products={products}
                      onAddProduct={addNewProduct}
                    />
                  </ProtectedRoute>
                );
              case "store-profile-setup":
                return (
                  <ProtectedRoute allowedRoles={["customer", "store", "admin"]} onPageRedirect={setCurrentPage}>
                    <StoreProfileSetupView />
                  </ProtectedRoute>
                );
              case "admin-dashboard":
                return (
                  <ProtectedRoute allowedRoles={["admin"]} onPageRedirect={setCurrentPage}>
                    <AdminDashboardView />
                  </ProtectedRoute>
                );
              case "payment-success":
                return (
                  <PaymentStatusView type="success" setCurrentPage={setCurrentPage} />
                );
              case "payment-cancel":
                return (
                  <PaymentStatusView type="cancel" setCurrentPage={setCurrentPage} />
                );
              default:
                return (
                  <HomeView
                    products={products}
                    setCurrentPage={setCurrentPage}
                    onSelectProduct={handleInspectSelectedProduct}
                  />
                );
            }
          })()}
        </Suspense>
      </main>

      {/* Slide-out right panel organic shopping cart drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} setCurrentPage={setCurrentPage} />

      {/* Prime Footer */}
      <Footer setCurrentPage={setCurrentPage} />

      {/* Floating Chatbot Assistant */}
      <Chatbot />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000
        }}
      />

    </div>
  );
}
