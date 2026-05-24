"use client";

import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, ArrowRight, Trash2, ShieldCheck, Leaf } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart } = useStore();

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = subtotal > 500000 ? 0 : 35000;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <main className="pt-32 pb-24 px-6 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
            <ShoppingCart size={40} className="text-slate-300" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Giỏ hàng trống</h1>
          <p className="text-slate-500 mb-8">Bạn chưa thêm bất kỳ cây xanh nào vào giỏ hàng. Hãy khám phá cửa hàng của chúng tôi ngay!</p>
          <Link href="/shop" className="btn-primary w-full flex items-center justify-center gap-2">
            Đến Cửa Hàng <ArrowRight size={20} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-24 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-10 text-slate-900 flex items-center gap-3">
          Giỏ Hàng <span className="text-lg px-3 py-1 bg-primary/10 text-primary rounded-full">{cart.length}</span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Cart Items */}
          <div className="lg:w-2/3 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hidden sm:grid grid-cols-12 gap-4 mb-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-6">Sản phẩm</div>
              <div className="col-span-3 text-center">Số lượng</div>
              <div className="col-span-3 text-right">Tổng cộng</div>
            </div>

            <AnimatePresence>
              {cart.map(item => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col sm:grid sm:grid-cols-12 gap-6 items-center relative group"
                >
                  {/* Remove Button (Mobile: Top Right, Desktop: Hover) */}
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-4 right-4 sm:opacity-0 sm:group-hover:opacity-100 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all z-10"
                    title="Xóa sản phẩm"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="col-span-6 flex gap-4 w-full">
                    <Link href={`/product/${item.id}`} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-slate-50">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">{item.category}</span>
                      <Link href={`/product/${item.id}`}>
                        <h3 className="font-bold text-slate-900 text-lg hover:text-primary transition-colors line-clamp-2">{item.name}</h3>
                      </Link>
                      <p className="text-slate-500 text-sm mt-1">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 flex justify-center w-full sm:w-auto">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-10 w-32">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex-1 h-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                      >-</button>
                      <span className="w-10 text-center font-bold text-slate-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex-1 h-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                      >+</button>
                    </div>
                  </div>

                  <div className="col-span-3 text-center sm:text-right w-full sm:w-auto">
                    <span className="font-black text-primary text-lg">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 sticky top-32 animate-fade-in">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Tổng đơn hàng</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính</span>
                  <span className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí giao hàng</span>
                  <span className="font-bold">{shipping === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xs flex items-start gap-2 border border-blue-100">
                    <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                    <span>Mua thêm <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(500000 - subtotal)}</strong> để được miễn phí giao hàng!</span>
                  </div>
                )}
                <hr className="border-slate-100" />
                <div className="flex justify-between text-slate-900 text-xl font-black">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</span>
                </div>
              </div>

              <button className="btn-primary w-full py-4 text-lg flex justify-center items-center gap-2 mb-4 group shadow-xl shadow-primary/20">
                Thanh Toán Ngay <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mt-6">
                <Leaf size={16} className="text-accent" />
                <span>100% Cây khỏe mạnh khi nhận hàng</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
