import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingCart, Heart, ShieldCheck, Truck, ArrowRight, Check } from 'lucide-react';
import { plants } from '@/src/services/mockData';
import { useStore } from '@/src/store';
import { useState } from 'react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plant = plants.find(p => p.id === id);
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!plant) {
    return (
      <main className="pt-32 pb-24 px-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Không tìm thấy sản phẩm</h1>
          <p className="text-slate-500 mb-8">Sản phẩm này không tồn tại hoặc đã bị xóa.</p>
          <Link to="/shop" className="btn-primary">Quay lại cửa hàng</Link>
        </div>
      </main>
    );
  }

  const isWishlisted = isInWishlist(plant.id);

  const handleAddToCart = () => {
    addToCart(plant, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <main className="pt-24 pb-24 min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100 py-4 px-6 mb-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => navigate(-1)} className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft size={16} /> Quay lại
          </button>
          <span>/</span>
          <Link to="/shop" className="hover:text-primary transition-colors">Cửa Hàng</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium line-clamp-1">{plant.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden flex flex-col lg:flex-row mb-16">
          
          {/* Image Gallery */}
          <div className="lg:w-1/2 p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-[32px] overflow-hidden bg-slate-100 relative group"
            >
              <img 
                src={plant.image} 
                alt={plant.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => toggleWishlist(plant)}
                className="absolute top-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-full shadow-lg transition-transform hover:scale-110"
              >
                <Heart size={24} className={isWishlisted ? "fill-red-500 text-red-500" : "text-slate-400"} />
              </button>
              <div className="absolute bottom-6 left-6 flex flex-wrap gap-2">
                {plant.tags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-emerald-700 text-xs font-bold rounded-full shadow-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="lg:w-1/2 p-8 lg:p-12 lg:border-l border-slate-100 flex flex-col">
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-100">
                {plant.category === 'indoor' ? 'Cây trong nhà' : plant.category === 'outdoor' ? 'Cây ngoài trời' : plant.category === 'succulent' ? 'Sen đá' : 'Cây văn phòng'}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-2">{plant.name}</h1>
              <p className="text-lg text-slate-400 italic font-serif mb-6">{plant.scientificName}</p>
              <div className="text-3xl font-black text-primary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plant.price)}
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed mb-8 text-lg">
              {plant.description}
            </p>

            {/* Care Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Mức độ chăm sóc</span>
                <span className="font-medium text-slate-900">{plant.careLevel}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ánh sáng</span>
                <span className="font-medium text-slate-900">{plant.light}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Nước tưới</span>
                <span className="font-medium text-slate-900">{plant.water}</span>
              </div>
            </div>

            <hr className="border-slate-100 mb-8" />

            {/* Actions */}
            <div className="mt-auto">
              <div className="flex items-center gap-6 mb-6">
                <span className="font-bold text-slate-900">Số lượng:</span>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-12">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-primary transition-colors"
                  >-</button>
                  <span className="w-12 text-center font-bold text-slate-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-primary transition-colors"
                  >+</button>
                </div>
              </div>

              <button 
                onClick={handleAddToCart}
                className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${added ? 'bg-primary text-white' : 'bg-slate-900 text-white hover:bg-primary hover:shadow-xl hover:shadow-primary/20'}`}
              >
                {added ? (
                  <><Check size={24} /> Đã thêm vào giỏ hàng</>
                ) : (
                  <><ShoppingCart size={24} /> Thêm vào giỏ hàng</>
                )}
              </button>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <span>Bảo hành cây 7 ngày</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Truck size={20} />
                </div>
                <span>Giao hàng an toàn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion Section */}
        <div>
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold">Có thể bạn sẽ thích</h2>
            <Link to="/shop" className="text-primary font-bold hover:underline flex items-center gap-2">
              Xem thêm <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {plants.filter(p => p.id !== plant.id).slice(0, 4).map(p => (
              <Link key={p.id} to={`/product/${p.id}`} className="group bg-white p-4 rounded-3xl border border-slate-100 hover:shadow-xl transition-all">
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-slate-50">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h4 className="font-bold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h4>
                <p className="text-primary font-bold text-sm mt-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
