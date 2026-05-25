import React, { useState } from "react";
import { Navigation, Footer } from "./components/Navigation";
import { HomeView } from "./components/HomeView";
import { ShopView } from "./components/ShopView";
import { ProductDetailView } from "./components/ProductDetailView";
import { AIDiagnosisView } from "./components/AIDiagnosisView";
import { BookingView } from "./components/BookingView";
import { BlogView } from "./components/BlogView";
import { AuthView } from "./components/AuthView";
import { CustomerDashboardView } from "./components/CustomerDashboardView";
import { StoreDashboardView } from "./components/StoreDashboardView";
import { AdminDashboardView } from "./components/AdminDashboardView";
import { Product, Appointment, DiagnosisLog } from "./types";
import { useAppContext } from "./context/AppContext";
import { useCart } from "./hooks/useCart";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight } from "lucide-react";

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
    diagnosePlant
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

  // Local Drawer Toggle & Checkout Indicator
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  // Cart Handlers bridging UI events
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    addToCart(product, quantity);
    setCheckoutComplete(false);
    setCartOpen(true);
  };

  const handleCheckoutSubmit = () => {
    if (cart.length === 0) return;
    setCheckoutComplete(true);
    clearCart();
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
                />
              );
            case "shop":
              return (
                <ShopView
                  products={products}
                  onSelectProduct={handleInspectSelectedProduct}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
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
                <BookingView
                  appointments={appointments}
                  onAddAppointment={(apt: Appointment) => {
                    bookExpert({
                      expertName: apt.expertName,
                      title: apt.title,
                      date: apt.date,
                      time: apt.time,
                      type: apt.type,
                      price: apt.price,
                      expertAvatar: apt.expertAvatar,
                      userNotes: apt.userNotes
                    });
                  }}
                />
              );
            case "blog":
              return <BlogView />;
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
                  <StoreDashboardView
                    products={products}
                    onAddProduct={addNewProduct}
                  />
                </ProtectedRoute>
              );
            case "admin-dashboard":
              return (
                <ProtectedRoute allowedRoles={["admin"]} onPageRedirect={setCurrentPage}>
                  <AdminDashboardView />
                </ProtectedRoute>
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

      </main>

      {/* Slide-out right panel organic shopping cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            
            {/* Backdrop cover */}
            <div 
              onClick={() => setCartOpen(false)}
              className="absolute inset-0 bg-stone-950/75 transition-opacity opacity-100 duration-200" 
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col bg-stone-950 border-l border-stone-800 shadow-2xl text-stone-300">
                  
                  {/* Cart Header */}
                  <div className="flex items-center justify-between border-b border-stone-850 px-5 py-5">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2" id="slide-over-title">
                      <ShoppingBag className="h-4.5 w-4.5 text-emerald-400" />
                      Giỏ Hàng Sinh Thái Của Bạn
                    </h2>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="rounded-lg p-2 bg-stone-900 hover:bg-stone-850 text-stone-500 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Cart Contents Section */}
                  <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
                    
                    {/* Checkout message screen */}
                    {checkoutComplete && (
                      <div className="text-center py-10 px-4 bg-emerald-950/45 border border-emerald-500/20 rounded-2xl space-y-3">
                        <div className="text-4xl">🌱</div>
                        <h4 className="text-sm font-semibold text-emerald-400">Đặt hàng thành công!</h4>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          Hệ thống đã xác nhận đơn hàng hữu cơ của bạn và tích lũy carbon thăng hạng đóng góp của bạn trên tài khoản GreenLife.
                        </p>
                        <button
                          onClick={() => {
                            setCheckoutComplete(false);
                            setCartOpen(false);
                          }}
                          className="mt-2 text-xs text-emerald-400 hover:underline inline-block font-semibold cursor-pointer"
                        >
                          Tiếp tục khám phá
                        </button>
                      </div>
                    )}

                    {!checkoutComplete && cart.length === 0 ? (
                      <div className="text-center py-20 text-stone-500 space-y-4">
                        <div className="text-4xl text-stone-700">🛒</div>
                        <p className="text-xs">Giỏ hàng rỗng. Hãy bồi bổ thêm dinh dưỡng đất hoặc cây hoa hồng nhé.</p>
                        <button
                          onClick={() => {
                            setCartOpen(false);
                            setCurrentPage("shop");
                          }}
                          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-semibold cursor-pointer border border-stone-800"
                        >
                          Ghé xem cửa hàng ngay
                        </button>
                      </div>
                    ) : null}

                    {!checkoutComplete && cart.length > 0 && (
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div 
                            key={item.product.id} 
                            className="bg-stone-900/30 border border-stone-850 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs animate-fadeIn"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded-xl"
                                referrerPolicy="no-referrer"
                              />
                              <div className="space-y-0.5">
                                <span className="font-semibold text-white block line-clamp-1">{item.product.name}</span>
                                <span className="text-emerald-400 font-mono block mt-0.5">{(item.product.price * item.quantity).toLocaleString("vi-VN")}₫</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Dec/Inc Quantity buttons */}
                              <div className="flex items-center bg-stone-950 border border-stone-850 rounded-lg">
                                <button
                                  onClick={() => updateCartQuantity(item.product.id, -1)}
                                  className="px-2 py-1 text-stone-500 hover:text-white cursor-pointer"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-2 text-[11px] text-white font-mono">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.product.id, 1)}
                                  className="px-2 py-1 text-stone-500 hover:text-white cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="p-1.5 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Xóa khỏi giỏ"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cart Footer Price totals and transaction action */}
                  {!checkoutComplete && cart.length > 0 && (
                    <div className="border-t border-stone-850 bg-stone-950 p-5 space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-stone-500">Tổng phụ cộng:</span>
                          <span className="text-stone-300 font-mono">{cartTotal.toLocaleString("vi-VN")}₫</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Đóng gói hữu cơ:</span>
                          <span className="text-emerald-400 text-[10px] font-mono font-bold uppercaseScale">Miễn Phí (Eco Bag)</span>
                        </div>
                        <div className="flex justify-between border-t border-stone-850 pt-2 font-semibold">
                          <span className="text-white">Tổng cộng giao ước:</span>
                          <span className="text-emerald-400 text-sm font-mono">{cartTotal.toLocaleString("vi-VN")}₫</span>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-950/20 border border-emerald-900/10 rounded-xl text-[10px] text-stone-400 leading-normal">
                        🌿 Mua hàng đóng góp trực tiếp <strong className="text-emerald-400">-{co2OffsetKg} kg CO₂</strong> khí phát thải bù đắp bảo vệ mầm xanh quốc thổ.
                      </div>

                      <button
                        onClick={handleCheckoutSubmit}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase rounded-xl cursor-pointer transition-all tracking-wider text-xs"
                      >
                        Tiến Hành Thanh Toán An Lành
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Prime Footer */}
      <Footer setCurrentPage={setCurrentPage} />

    </div>
  );
}
