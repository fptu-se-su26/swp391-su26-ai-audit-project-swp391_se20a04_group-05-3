import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Leaf, Shield, Zap, Star } from 'lucide-react';
import { plants, services, blogPosts } from '../data';
import PlantCard from '../components/PlantCard';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 px-6">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2000"
            alt="Hero Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-nature-100/50 backdrop-blur-md rounded-full text-emerald-800 text-sm font-bold mb-6 border border-emerald-200">
              <Star size={16} fill="currentColor" />
              <span>Nền tảng cây xanh #1 Việt Nam</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 text-slate-900">
              Mang <span className="text-primary italic">Thiên Nhiên</span> Vào <br /> Không Gian Sống
            </h1>
            <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
              GreenLife cung cấp giải pháp toàn diện từ chọn cây, chăm sóc đến hỗ trợ kỹ thuật bằng AI. Nâng tầm cuộc sống với sắc xanh thuần khiết.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/shop" className="btn-primary !px-8 !py-4 flex items-center gap-2 text-lg">
                Mua Ngay <ArrowRight size={20} />
              </Link>
              <Link to="/services" className="btn-secondary !px-8 !py-4 text-lg">
                Xem Dịch Vụ
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <img key={i} className="w-12 h-12 rounded-full border-4 border-white" src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                ))}
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-900">10,000+ Khách hàng</p>
                <p className="text-slate-500">Đã tin dùng dịch vụ của chúng tôi</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative z-10 w-[500px] h-[600px] rounded-[100px] overflow-hidden shadow-2xl border-8 border-white/50 backdrop-blur-xl rotate-3">
              <img
                src="https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800"
                alt="Featured Plant"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Animated badges */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-20 -left-10 z-20 glass p-4 rounded-2xl flex items-center gap-3 shadow-xl"
            >
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-primary">
                <Leaf size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Lọc không khí</p>
                <p className="font-bold">Đạt chuẩn 98%</p>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-40 -right-10 z-20 glass p-4 rounded-2xl flex items-center gap-3 shadow-xl"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Zap size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Hỗ trợ AI</p>
                <p className="font-bold">24/7 tức thì</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories / Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tại sao chọn GreenLife?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto italic">Chúng tôi không chỉ bán cây, chúng tôi mang tới những giá trị vững bền cho tương lai.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-nature-50 border border-nature-100 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm mb-6 group-hover:scale-110 transition-transform">
                <Shield size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Chất Lượng Đảm Bảo</h3>
              <p className="text-slate-600">Mọi cây xanh đều được tuyển chọn kỹ lưỡng và kiểm tra sức khỏe định kỳ trước khi đến tay bạn.</p>
            </div>
            <div className="p-8 rounded-3xl bg-nature-50 border border-nature-100 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm mb-6 group-hover:scale-110 transition-transform">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Công Nghệ AI</h3>
              <p className="text-slate-600">Ứng dụng trí tuệ nhân tạo để chẩn đoán bệnh cho cây nhanh chóng qua hình ảnh chụp.</p>
            </div>
            <div className="p-8 rounded-3xl bg-nature-50 border border-nature-100 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm mb-6 group-hover:scale-110 transition-transform">
                <Leaf size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Chăm Sóc Trọn Đời</h3>
              <p className="text-slate-600">Đội ngũ kỹ thuật viên luôn sẵn sàng hỗ trợ bạn trong suốt quá trình cây phát triển.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-bold mb-4">Cây Xanh Nổi Bật</h2>
              <p className="text-slate-500 max-w-xl">Những sản phẩm được yêu thích nhất trong tuần, mang lại năng lượng tích cực cho không gian của bạn.</p>
            </div>
            <Link to="/shop" className="group flex items-center gap-2 font-bold text-primary hover:gap-3 transition-all">
              Xem tất cả cửa hàng <ArrowRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {plants.map(plant => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        </div>
      </section>

      {/* Services Callout */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-primary rounded-[60px] p-12 lg:p-24 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <Leaf size={400} className="transform rotate-45 translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="max-w-2xl relative z-10">
            <h2 className="text-4xl lg:text-5xl font-bold mb-8 leading-tight">Biến không gian của bạn thành một <span className="text-accent underline decoration-wavy">ốc đảo xanh</span></h2>
            <p className="text-lg opacity-80 mb-12">
              Chúng tôi cung cấp các dịch vụ chuyên nghiệp từ thiết kế, thi công đến bảo trì cảnh quan. Đội ngũ chuyên gia sẽ giúp bạn hiện thực hóa ý tưởng.
            </p>
            <div className="grid sm:grid-cols-3 gap-8">
              {services.map(service => (
                <div key={service.id} className="space-y-4">
                  <h4 className="font-bold text-xl">{service.title}</h4>
                  <p className="text-sm opacity-70">{service.description}</p>
                </div>
              ))}
            </div>
            <button className="mt-16 py-4 px-10 bg-accent text-primary rounded-full font-bold hover:bg-nature-200 transition-all">
              Đặt lịch tư vấn ngay
            </button>
          </div>
        </div>
      </section>

      {/* Blog Teaser */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Kiến Thức Cây Xanh</h2>
            <p className="text-slate-500 italic">Học cách chăm sóc và yêu thương những người bạn xanh của mình.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {blogPosts.map(post => (
              <Link to={`/blog/${post.id}`} key={post.id} className="flex flex-col lg:flex-row gap-6 p-4 rounded-3xl hover:bg-slate-50 transition-all group">
                <div className="lg:w-1/2 aspect-video overflow-hidden rounded-2xl">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="lg:w-1/2 flex flex-col justify-center py-2">
                  <span className="text-xs font-bold text-accent uppercase mb-2 tracking-widest">{post.category}</span>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{post.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-3 mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-medium text-slate-600">{post.author}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
